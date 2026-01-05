import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
  };
  schema: string;
  old_record: null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("Webhook payload received:", JSON.stringify(payload, null, 2));

    // Only process INSERT events on profiles table
    if (payload.type !== "INSERT" || payload.table !== "profiles") {
      return new Response(JSON.stringify({ message: "Ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, full_name } = payload.record;
    
    if (!email) {
      console.log("No email found in profile record");
      return new Response(JSON.stringify({ message: "No email" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userName = full_name || email.split("@")[0];
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
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Nzila!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 16px;">Thank you for creating your account! We're excited to have you on board.</p>
          <p style="font-size: 16px;">Your account has been set up successfully and you can now access all features:</p>
          <ul style="font-size: 16px;">
            <li>📅 Book classes and training sessions</li>
            <li>📊 Track your fitness progress</li>
            <li>👥 Connect with trainers and coaches</li>
            <li>💳 Manage your membership</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">If you have any questions, our support team is here to help.</p>
          <p style="font-size: 14px; color: #666;">Best regards,<br>The Nzila Team</p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
          <p>This email was sent to ${email}</p>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending welcome email to: ${email}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("FROM_EMAIL") || "Nzila Gym <onboarding@resend.dev>",
        to: [email],
        subject: "🎉 Welcome to Nzila - Your Account is Ready!",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${errorData}`);
    }

    const data = await response.json();
    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
