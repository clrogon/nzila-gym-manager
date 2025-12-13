import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  role: "super_admin" | "gym_owner" | "admin" | "staff" | "member";
  gym_id: string | null;
}

// Test users: 2 per role
const TEST_USERS: TestUser[] = [
  // Super Admins (platform-level, no gym_id)
  { email: "superadmin1@nzila.ao", password: "!12345678#", full_name: "Super Admin One", role: "super_admin", gym_id: null },
  { email: "superadmin2@nzila.ao", password: "!12345678#", full_name: "Super Admin Two", role: "super_admin", gym_id: null },
  
  // Gym Owners (will be assigned to test gym)
  { email: "gymowner1@nzila.ao", password: "!12345678#", full_name: "Gym Owner One", role: "gym_owner", gym_id: "PLACEHOLDER" },
  { email: "gymowner2@nzila.ao", password: "!12345678#", full_name: "Gym Owner Two", role: "gym_owner", gym_id: "PLACEHOLDER" },
  
  // Admins
  { email: "admin1@nzila.ao", password: "!12345678#", full_name: "Admin One", role: "admin", gym_id: "PLACEHOLDER" },
  { email: "admin2@nzila.ao", password: "!12345678#", full_name: "Admin Two", role: "admin", gym_id: "PLACEHOLDER" },
  
  // Staff (trainers/receptionists)
  { email: "staff1@nzila.ao", password: "!12345678#", full_name: "Staff Member One", role: "staff", gym_id: "PLACEHOLDER" },
  { email: "staff2@nzila.ao", password: "!12345678#", full_name: "Staff Member Two", role: "staff", gym_id: "PLACEHOLDER" },
  
  // Members
  { email: "member1@nzila.ao", password: "!12345678#", full_name: "Member One", role: "member", gym_id: "PLACEHOLDER" },
  { email: "member2@nzila.ao", password: "!12345678#", full_name: "Member Two", role: "member", gym_id: "PLACEHOLDER" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const results: { email: string; status: string; error?: string; user_id?: string }[] = [];

    // First, get or create a test gym
    let testGymId: string;
    
    const { data: existingGym } = await supabaseAdmin
      .from("gyms")
      .select("id")
      .eq("slug", "test-gym-seed")
      .single();

    if (existingGym) {
      testGymId = existingGym.id;
    } else {
      // Create test gym using service role (bypasses RLS)
      const { data: newGym, error: gymError } = await supabaseAdmin
        .from("gyms")
        .insert({
          name: "Test Gym (Seed)",
          slug: "test-gym-seed",
          email: "testgym@nzila.ao",
          subscription_status: "active",
        })
        .select("id")
        .single();

      if (gymError) {
        throw new Error(`Failed to create test gym: ${gymError.message}`);
      }
      testGymId = newGym.id;
    }

    // Process each test user
    for (const testUser of TEST_USERS) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === testUser.email);

        let userId: string;

        if (existingUser) {
          // Delete existing user to reset
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        }

        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: { full_name: testUser.full_name }
        });

        if (createError) {
          results.push({ email: testUser.email, status: "error", error: createError.message });
          continue;
        }

        userId = newUser.user.id;

        // Profile is auto-created by trigger, but update full_name
        await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            email: testUser.email,
            full_name: testUser.full_name,
          });

        // Determine gym_id for role assignment
        const gymIdForRole = testUser.role === "super_admin" ? null : testGymId;

        // Delete existing roles for this user
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            gym_id: gymIdForRole,
            role: testUser.role,
          });

        if (roleError) {
          results.push({ email: testUser.email, status: "partial", error: `User created but role failed: ${roleError.message}`, user_id: userId });
          continue;
        }

        results.push({ email: testUser.email, status: "success", user_id: userId });

      } catch (userError) {
        results.push({ email: testUser.email, status: "error", error: String(userError) });
      }
    }

    const summary = {
      test_gym_id: testGymId,
      total: TEST_USERS.length,
      success: results.filter(r => r.status === "success").length,
      errors: results.filter(r => r.status === "error").length,
      users: results,
      credentials_info: "All users have password: !12345678#"
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
