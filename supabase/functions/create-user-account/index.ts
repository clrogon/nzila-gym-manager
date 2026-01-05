import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  fullName: string;
  phone?: string;
  role?: "member" | "staff" | "coach" | "trainer" | "instructor" | "receptionist";
  gymId?: string;
  memberId?: string; // If linking to existing member record
  sendWelcomeEmail?: boolean;
}

// Generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure complexity requirements
  return password + "Aa1!";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !callerUser) {
      throw new Error("Unauthorized");
    }

    const body: CreateUserRequest = await req.json();
    const { email, fullName, phone, role = "member", gymId, memberId, sendWelcomeEmail = true } = body;

    if (!email || !fullName) {
      throw new Error("Email and full name are required");
    }

    // Check caller permissions - they need to be admin/manager/gym_owner for the gym
    if (gymId) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUser.id)
        .eq("gym_id", gymId)
        .in("role", ["super_admin", "gym_owner", "manager", "admin"])
        .maybeSingle();

      // Also check super_admin without gym_id
      const { data: superAdminRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUser.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (!roleData && !superAdminRole) {
        throw new Error("You don't have permission to create users for this gym");
      }
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      // If user exists, just link them to the member record if provided
      if (memberId) {
        await supabaseAdmin
          .from("members")
          .update({ user_id: existingUser.id })
          .eq("id", memberId);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Existing user linked to member record",
            userId: existingUser.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      throw new Error("A user with this email already exists");
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
        created_by_admin: true,
      },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log(`User created: ${email}, ID: ${newUser.user.id}`);

    // Link to member record if provided
    if (memberId) {
      const { error: memberUpdateError } = await supabaseAdmin
        .from("members")
        .update({ user_id: newUser.user.id })
        .eq("id", memberId);
      
      if (memberUpdateError) {
        console.error("Failed to link member record:", memberUpdateError);
      }
    }

    // Assign role if gymId provided and role is staff-type
    if (gymId && role !== "member") {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: newUser.user.id,
          role: role,
          gym_id: gymId,
        });

      if (roleInsertError) {
        console.error("Role assignment error:", roleInsertError);
      }
    }

    // Get gym name for email
    let gymName = "Nzila";
    if (gymId) {
      const { data: gym } = await supabaseAdmin
        .from("gyms")
        .select("name")
        .eq("id", gymId)
        .single();
      if (gym) gymName = gym.name;
    }

    // Track email notification
    await supabaseAdmin.from("email_notifications").insert({
      user_id: newUser.user.id,
      email_type: "welcome_admin_created",
      recipient_email: email,
      status: sendWelcomeEmail ? "pending" : "skipped",
      metadata: { full_name: fullName, gym_name: gymName, role },
    });

    // Send welcome email with temporary password
    if (sendWelcomeEmail && resendApiKey) {
      const siteUrl = Deno.env.get("SITE_URL") || "https://nzila.app";
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${gymName}!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi <strong>${fullName}</strong>,</p>
            <p style="font-size: 16px;">An account has been created for you at <strong>${gymName}</strong>.</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">🔐 Your Login Credentials:</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="font-family: monospace; font-size: 18px; background: white; padding: 10px; border-radius: 3px; margin: 10px 0 0 0;">
                <strong>Temporary Password:</strong> ${tempPassword}
              </p>
            </div>
            
            <p style="font-size: 16px; color: #dc3545; font-weight: bold;">⚠️ Please change your password after your first login!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/auth" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">If you didn't expect this email, please contact our support team.</p>
            <p style="font-size: 14px; color: #666;">Best regards,<br>The ${gymName} Team</p>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("FROM_EMAIL") || "Nzila Gym <onboarding@resend.dev>",
          to: [email],
          subject: `Your account has been created at ${gymName}`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Email sending failed:", errorText);
        
        // Update notification status
        await supabaseAdmin
          .from("email_notifications")
          .update({ status: "failed", error_message: errorText })
          .eq("user_id", newUser.user.id)
          .eq("email_type", "welcome_admin_created");
      } else {
        // Update notification status
        await supabaseAdmin
          .from("email_notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("user_id", newUser.user.id)
          .eq("email_type", "welcome_admin_created");
        
        console.log(`Welcome email sent to ${email}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: sendWelcomeEmail 
          ? "User created successfully. Login credentials sent via email."
          : "User created successfully.",
        userId: newUser.user.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Create user error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
