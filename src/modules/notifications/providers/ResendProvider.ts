import { EmailProvider } from "./EmailProvider";
import { Resend } from "resend";

export class ResendProvider implements EmailProvider {
  private client = new Resend(process.env.RESEND_API_KEY!);

  async send({ to, subject, html, text }: any) {
    await this.client.emails.send({
      from: "Ginásio <noreply@gym.app>",
      to,
      subject,
      html,
      text,
    });
  }
}
