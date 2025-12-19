export interface EmailProvider {
  send(input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void>;
}
