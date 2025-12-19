import { EmailProvider } from "./EmailProvider";

/**
 * Resend Email Provider
 * 
 * NOTE: This provider should only be used in Edge Functions, not in frontend code.
 * For frontend email sending, use the edge function approach via supabase.functions.invoke()
 */
export class ResendProvider implements EmailProvider {
  async send({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    // In frontend code, we should call an edge function instead
    console.warn(
      'ResendProvider.send() called from frontend. ' +
      'Email sending should be done via an Edge Function. ' +
      'Use supabase.functions.invoke("send-email", { body: payload }) instead.'
    );
    
    // This is a no-op in frontend - actual email sending happens in Edge Functions
  }
}
