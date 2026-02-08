import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

interface MobileTokenPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

const tokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string(),
  role: z.enum(["user", "admin"]),
});

const getSecret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function signMobileToken(
  payload: MobileTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("ai-digest-api")
    .setAudience("ai-digest-mobile")
    .sign(getSecret());
}

export async function verifyMobileToken(
  token: string
): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: "ai-digest-api",
      audience: "ai-digest-mobile",
    });

    const validated = tokenPayloadSchema.safeParse(payload);
    if (!validated.success) return null;

    return validated.data;
  } catch {
    return null;
  }
}
