import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./session";
import { verifyMobileToken } from "./mobile-auth";

/**
 * Require admin session for API routes.
 * Returns null if authorized, NextResponse error if not.
 * Checks Bearer token first (mobile clients), falls back to iron-session (web clients).
 */
export async function requireAdminFromRequest(
  request?: NextRequest
): Promise<NextResponse | null> {
  // Check Bearer token first (mobile clients)
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = await verifyMobileToken(token);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      if (payload.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        );
      }
      return null;
    }
  }

  // Fall back to iron-session (web clients)
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

/** @deprecated Use requireAdminFromRequest */
export function requireAdmin(): Promise<NextResponse | null> {
  return requireAdminFromRequest();
}
