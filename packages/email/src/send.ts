import { Resend } from "resend";
import { DigestEmail } from "./templates/digest-email";
import type { DigestEmailSection } from "./templates/digest-email";
import { WelcomeEmail } from "./templates/welcome-email";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "AI Digest <digest@ai-digest.dev>";

/** Input data for digest newsletter delivery. */
interface DigestNewsletterInput {
  /** Digest date in formatted string (e.g., "January 15, 2024") */
  digestDate: string;
  /** Executive summary text */
  synthesis: string;
  /** Topic sections with ranked items */
  sections: DigestEmailSection[];
}

/**
 * Send digest newsletter to all subscribers via Resend.
 *
 * Includes automatic retry logic (up to 3 attempts with exponential backoff).
 * Adds unsubscribe headers for compliance with email best practices.
 *
 * @param digest - Digest content including date, summary, and sections
 * @param subscriberEmails - List of recipient email addresses
 * @param unsubscribeBaseUrl - Base URL for unsubscribe links
 * @returns Count of successful sends and failures
 * @throws {Error} When RESEND_API_KEY is not configured
 */
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
        await getResend().emails.send({
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

/**
 * Send welcome email to a new subscriber.
 *
 * @param email - Recipient email address
 * @param unsubscribeBaseUrl - Base URL for unsubscribe links
 * @throws {Error} When RESEND_API_KEY is not configured or send fails
 */
export async function sendWelcomeEmail(
  email: string,
  unsubscribeBaseUrl: string
): Promise<void> {
  const unsubscribeUrl = `${unsubscribeBaseUrl}?email=${encodeURIComponent(email)}`;

  await getResend().emails.send({
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
