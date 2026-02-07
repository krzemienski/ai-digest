import { NextRequest, NextResponse } from "next/server";

export function requireAdmin(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get("x-api-key");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || apiKey !== adminKey) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
}

export function requireAdminFromRequest(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get("x-api-key");
  const cookieToken = request.cookies.get("admin-token")?.value;
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || (apiKey !== adminKey && cookieToken !== adminKey)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
}
