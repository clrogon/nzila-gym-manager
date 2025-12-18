interface SendEmailInput {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

export async function sendEmail(input: SendEmailInput) {
  // TEMP: console log
  if (process.env.NODE_ENV !== "production") {
    console.log("EMAIL:", input);
    return;
  }

  // PROD: integra SendGrid / Resend / SES
}
