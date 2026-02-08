import { NextResponse } from "next/server";
import { getSession, type SessionData } from "./session";

export async function requireSession(): Promise<
  { session: SessionData; error: null } | { session: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}

export async function requireAdminSession(): Promise<
  { session: SessionData; error: null } | { session: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  if (session.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ),
    };
  }
  return { session, error: null };
}
