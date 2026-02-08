import { NextResponse } from "next/server";
import { getSession } from "./session";

/**
 * Require admin session for API routes.
 * Returns null if authorized, NextResponse error if not.
 * Replaces old x-api-key / admin-token cookie checks.
 */
export async function requireAdminFromRequest(): Promise<NextResponse | null> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  return null;
}

/** @deprecated Use requireAdminFromRequest (no argument needed now) */
export function requireAdmin(): Promise<NextResponse | null> {
  return requireAdminFromRequest();
}
