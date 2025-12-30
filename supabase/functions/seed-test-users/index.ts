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

    // ========== AUTHENTICATION CHECK ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid token or user not found:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // ========== SUPER ADMIN ROLE CHECK ==========
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error(`User ${user.email} attempted to seed test users without super_admin role`);
      return new Response(
        JSON.stringify({ error: "Only super admins can seed test users" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    console.log(`Super admin ${user.email} authorized to seed test users`);

    // ========== PROCEED WITH SEEDING ==========
    const results: { email: string; status: string; error?: string; user_id?: string }[] = [];

    // Use existing gym or first available gym
    let testGymId: string;
    
    const { data: existingGyms, error: gymFetchError } = await supabaseAdmin
      .from("gyms")
      .select("id, name")
      .limit(1);

    if (gymFetchError || !existingGyms || existingGyms.length === 0) {
      throw new Error("No gym found. Please create a gym first via the onboarding wizard.");
    }
    
    testGymId = existingGyms[0].id;
    console.log(`Using existing gym: ${existingGyms[0].name} (${testGymId})`);

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
        const { error: roleAssignError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            gym_id: gymIdForRole,
            role: testUser.role,
          });

        if (roleAssignError) {
          results.push({ email: testUser.email, status: "partial", error: `User created but role failed: ${roleAssignError.message}`, user_id: userId });
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

    console.log(`Test user seeding complete: ${summary.success}/${summary.total} successful`);

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error while seeding test users:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred while seeding test users." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
