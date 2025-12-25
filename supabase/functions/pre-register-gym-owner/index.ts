import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreRegistrationRequest {
  email: string;
  fullName: string;
  gymName: string;
  phone?: string;
  message?: string;
}

// Hash password using SHA-256 (for audit trail only - actual auth uses Supabase)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is super admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Only super admins can pre-register gym owners");
    }

    const body: PreRegistrationRequest = await req.json();
    const { email, fullName, gymName, phone, message } = body;

    if (!email || !fullName || !gymName) {
      throw new Error("Email, full name, and gym name are required");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Generate a temporary password (secure random)
    const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
    
    // Hash the password for audit storage (never store plaintext)
    const hashedTempPassword = await hashPassword(tempPassword);

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        pending_gym_name: gymName,
        phone: phone || null,
        is_pre_registered: true,
      },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    // Create the profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // Assign gym_owner role (without gym_id for now - they'll create their gym in onboarding)
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "gym_owner",
        gym_id: null,
      });

    if (roleInsertError) {
      console.error("Role assignment error:", roleInsertError);
    }

    // Store pre-registration record with HASHED password (for audit only)
    const { error: preRegError } = await supabaseAdmin
      .from("gym_owner_invitations")
      .insert({
        user_id: newUser.user.id,
        email,
        full_name: fullName,
        gym_name: gymName,
        phone: phone || null,
        message: message || null,
        invited_by: user.id,
        temp_password: hashedTempPassword, // Store hash, not plaintext
        status: "pending",
      });

    if (preRegError) {
      console.error("Pre-registration record error:", preRegError);
    }

    // Log invitation creation (without sensitive data)
    console.log(`Gym owner invitation created for: ${email}, gym: ${gymName}`);

    // Send email via Resend if configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Nzila <noreply@nzila.app>",
          to: [email],
          subject: "Welcome to Nzila - Complete Your Gym Setup",
          html: `
            <h1>Welcome to Nzila, ${fullName}!</h1>
            <p>You've been invited to set up your gym "${gymName}" on the Nzila platform.</p>
            ${message ? `<p><strong>Message from admin:</strong> ${message}</p>` : ""}
            <p>Your temporary login credentials:</p>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Password:</strong> ${tempPassword}</li>
            </ul>
            <p>Please log in and complete your gym setup. You'll be prompted to change your password on first login.</p>
            <p><a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth">Click here to get started</a></p>
            <p>Best regards,<br>The Nzila Team</p>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Email sending failed:", await emailResponse.text());
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Gym owner pre-registered successfully. Credentials sent via email.",
        userId: newUser.user.id,
        // Never return password in response - it's sent via email only
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Pre-registration error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
