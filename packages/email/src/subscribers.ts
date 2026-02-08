import { Resend } from "resend";

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
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";

export async function addResendContact(
  email: string
): Promise<string | null> {
  if (!RESEND_AUDIENCE_ID) {
    console.warn(
      "RESEND_AUDIENCE_ID not configured, skipping Resend contact creation"
    );
    return null;
  }

  try {
    const response = await getResend().contacts.create({
      email,
      audienceId: RESEND_AUDIENCE_ID,
    });
    return response.data?.id ?? null;
  } catch (error) {
    console.error("Failed to add Resend contact:", error);
    return null;
  }
}

export async function removeResendContact(email: string): Promise<void> {
  if (!RESEND_AUDIENCE_ID) {
    return;
  }

  try {
    await getResend().contacts.remove({
      email,
      audienceId: RESEND_AUDIENCE_ID,
    });
  } catch (error) {
    console.error("Failed to remove Resend contact:", error);
  }
}
