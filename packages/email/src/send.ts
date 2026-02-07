import { Resend } from "resend";
import { DigestEmail } from "./templates/digest-email";
import type { DigestEmailSection } from "./templates/digest-email";
import { WelcomeEmail } from "./templates/welcome-email";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "AI Digest <digest@ai-digest.dev>";

interface DigestNewsletterInput {
  digestDate: string;
  synthesis: string;
  sections: DigestEmailSection[];
}

export async function sendDigestNewsletter(
  digest: DigestNewsletterInput,
  subscriberEmails: string[],
  unsubscribeBaseUrl: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of subscriberEmails) {
    const unsubscribeUrl = `${unsubscribeBaseUrl}?email=${encodeURIComponent(email)}`;

    let attempts = 0;
    let success = false;

    while (attempts < 3 && !success) {
      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: `AI Digest — ${digest.digestDate}`,
          react: DigestEmail({
            digestDate: digest.digestDate,
            synthesis: digest.synthesis,
            sections: digest.sections,
            unsubscribeUrl,
          }),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        sent = sent + 1;
        success = true;
      } catch (error) {
        attempts = attempts + 1;
        if (attempts < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempts - 1))
          );
        } else {
          console.error(
            `Failed to send to ${email} after 3 attempts:`,
            error
          );
          failed = failed + 1;
        }
      }
    }
  }

  return { sent, failed };
}

export async function sendWelcomeEmail(
  email: string,
  unsubscribeBaseUrl: string
): Promise<void> {
  const unsubscribeUrl = `${unsubscribeBaseUrl}?email=${encodeURIComponent(email)}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Welcome to AI Digest",
    react: WelcomeEmail({ unsubscribeUrl }),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}
