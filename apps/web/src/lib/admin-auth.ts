import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * Require admin session for API routes.
 * Returns null if authorized, NextResponse error if not.
 * Supports two auth methods:
 *   1. Supabase session cookie (browser-based)
 *   2. x-admin-api-key header (programmatic access)
 */
export async function requireAdminFromRequest(
  request?: NextRequest
): Promise<NextResponse | null> {
  // API key auth: enables programmatic access (curl, cron, external services)
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (adminApiKey && request) {
    const providedKey = request.headers.get("x-admin-api-key");
    if (providedKey === adminApiKey) {
      return null;
    }
  }

  // Supabase cookie auth: browser-based sessions
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (user.app_metadata?.role !== "admin") {
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
