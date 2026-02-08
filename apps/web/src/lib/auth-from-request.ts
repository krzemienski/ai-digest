import { verifyMobileToken } from "./mobile-auth";
import { getSession } from "./session";

interface AuthUser {
  userId: string;
  email: string;
  role: "user" | "admin";
}

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  // Check Bearer token first (mobile clients)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    if (payload) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
    return null; // Invalid token
  }

  // Fall back to iron-session (web clients)
  const session = await getSession();
  if (!session.isLoggedIn) {
    return null;
  }
  return {
    userId: session.userId,
    email: session.email,
    role: session.role,
  };
}
