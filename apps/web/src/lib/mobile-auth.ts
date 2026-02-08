import { SignJWT, jwtVerify } from "jose";

interface MobileTokenPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

const getSecret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function signMobileToken(
  payload: MobileTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyMobileToken(
  token: string
): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "user" | "admin",
    };
  } catch {
    return null;
  }
}
