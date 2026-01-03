import { supabase } from "@/integrations/supabase/client";

interface SendEmailInput {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

/**
 * Sends an email by invoking a Supabase Edge Function.
 * This ensures that sensitive API keys for email providers (like Resend or SendGrid)
 * are kept securely on the server side.
 */
export async function sendEmail(input: SendEmailInput) {
  // In development, we still log to console for easier debugging
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
    // We don't throw here to prevent blocking the UI flow, 
    // but in a real app, you might want to handle this more gracefully.
    return null;
  }
}
