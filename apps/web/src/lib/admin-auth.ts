import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * Require admin session for API routes.
 * Returns null if authorized, NextResponse error if not.
 * The request parameter is accepted for backward compatibility but unused.
 */
export async function requireAdminFromRequest(
  _request?: NextRequest
): Promise<NextResponse | null> {
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
