import { supabase } from "@/integrations/supabase/client";

interface SendEmailInput {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

interface WelcomeEmailInput {
  type: "welcome_self_signup" | "welcome_admin_created" | "password_reset" | "custom";
  to: string;
  userName?: string;
  gymName?: string;
  tempPassword?: string;
  resetLink?: string;
  customSubject?: string;
  customHtml?: string;
}

/**
 * Sends an email by invoking a Supabase Edge Function.
 * This ensures that sensitive API keys for email providers (like Resend)
 * are kept securely on the server side.
 */
export async function sendEmail(input: SendEmailInput) {
  if (import.meta.env.DEV) {
    console.log("DEBUG [Email Service]:", input);
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: input,
    });

    if (error) {
      console.error("Error invoking send-email function:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to send email via Edge Function:", err);
    return null;
  }
}

/**
 * Sends a welcome email to a new user.
 * Handles both self-signup and admin-created users.
 */
export async function sendWelcomeEmail(input: WelcomeEmailInput) {
  if (import.meta.env.DEV) {
    console.log("DEBUG [Welcome Email]:", input);
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: input,
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    return null;
  }
}

/**
 * Sends welcome email when admin creates a user with temporary password.
 */
export async function sendAdminCreatedUserEmail(
  email: string,
  userName: string,
  tempPassword: string,
  gymName?: string
) {
  return sendWelcomeEmail({
    type: "welcome_admin_created",
    to: email,
    userName,
    tempPassword,
    gymName: gymName || "Nzila Gym",
  });
}
