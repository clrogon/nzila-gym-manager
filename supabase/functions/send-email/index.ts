import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

interface WelcomeEmailRequest {
  type: "welcome_self_signup" | "welcome_admin_created" | "password_reset" | "custom";
  to: string;
  userName?: string;
  gymName?: string;
  tempPassword?: string;
  resetLink?: string;
  customSubject?: string;
  customHtml?: string;
}

const getEmailTemplate = (request: WelcomeEmailRequest): { subject: string; html: string } => {
  const { type, userName = "User", gymName = "our gym", tempPassword, resetLink } = request;
  const siteUrl = Deno.env.get("SITE_URL") || "https://nzila.app";

  switch (type) {
    case "welcome_self_signup":
      return {
        subject: `Welcome to ${gymName}! 🎉`,
        html: `
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
              <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
              <p style="font-size: 16px;">Thank you for joining us! Your account has been created successfully.</p>
              <p style="font-size: 16px;">You can now:</p>
              <ul style="font-size: 16px;">
                <li>Book classes and training sessions</li>
                <li>Track your progress and achievements</li>
                <li>View your membership details</li>
                <li>Access exclusive member content</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl}/auth" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Go to Your Dashboard
                </a>
              </div>
              <p style="font-size: 14px; color: #666;">If you have any questions, feel free to reach out to our team.</p>
              <p style="font-size: 14px; color: #666;">Best regards,<br>The ${gymName} Team</p>
            </div>
          </body>
          </html>
        `,
      };

    case "welcome_admin_created":
      return {
        subject: `Your account has been created at ${gymName}`,
        html: `
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
              <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
              <p style="font-size: 16px;">An account has been created for you at <strong>${gymName}</strong>.</p>
              
              ${tempPassword ? `
              <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">🔐 Your Temporary Password:</p>
                <p style="font-family: monospace; font-size: 18px; background: white; padding: 10px; border-radius: 3px; margin: 0; word-break: break-all;">${tempPassword}</p>
              </div>
              <p style="font-size: 16px; color: #dc3545; font-weight: bold;">⚠️ Please change your password immediately after your first login!</p>
              ` : ''}
              
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
        `,
      };

    case "password_reset":
      return {
        subject: `Reset your password for ${gymName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
              <p style="font-size: 16px;">We received a request to reset your password.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
              <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
              <p style="font-size: 14px; color: #666;">Best regards,<br>The ${gymName} Team</p>
            </div>
          </body>
          </html>
        `,
      };

    case "custom":
      return {
        subject: request.customSubject || "Message from " + gymName,
        html: request.customHtml || "",
      };

    default:
      throw new Error("Unknown email template type");
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Email request received:", JSON.stringify(body, null, 2));

    let emailSubject: string;
    let emailHtml: string;
    let toEmail: string;

    // Check if it's the new template-based format or legacy format
    if (body.type) {
      const request = body as WelcomeEmailRequest;
      const template = getEmailTemplate(request);
      emailSubject = template.subject;
      emailHtml = template.html;
      toEmail = request.to;
    } else {
      // Legacy format from emailService.ts
      const { to, subject, template, variables } = body as EmailRequest;
      toEmail = to;
      emailSubject = subject;
      
      // Simple template variable replacement
      emailHtml = template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || "");
    }

    console.log(`Sending email to: ${toEmail}, subject: ${emailSubject}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("FROM_EMAIL") || "Nzila Gym <onboarding@resend.dev>",
        to: [toEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${errorData}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
