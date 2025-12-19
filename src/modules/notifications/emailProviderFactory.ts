import { EmailProvider } from "./providers/EmailProvider";
import { ResendProvider } from "./providers/ResendProvider";

export function getEmailProvider(): EmailProvider {
  return new ResendProvider();
}
