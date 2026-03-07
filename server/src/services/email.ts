import { env } from "@/config/env";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (env.NODE_ENV === "development") {
    console.log(`📧 [Dev] Email to ${to}: ${subject}`);
    // In dev, we can pipe this to MailHog
    return;
  }

  // Implementation for Resend or AWS SES
  console.log(`📧 Sending email via Resend to ${to}`);
}

export const emailTemplates = {
  welcome: (name: string) => `<h1>Welcome to LuxeStay, ${name}!</h1>`,
  passwordReset: (url: string) => `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
};
