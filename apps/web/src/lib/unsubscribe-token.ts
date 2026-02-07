import { createHmac } from "node:crypto";

export function generateUnsubscribeToken(email: string, secret: string): string {
  return createHmac("sha256", secret).update(email).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string, secret: string): boolean {
  const expected = generateUnsubscribeToken(email, secret);
  return token === expected;
}
