import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const adminKey = process.env.ADMIN_API_KEY;
  const apiKey = request.headers.get("x-api-key");
  const cookieToken = request.cookies.get("admin-token")?.value;

  const isAuthorized = adminKey && (apiKey === adminKey || cookieToken === adminKey);

  if (!isAuthorized) {
    // API routes get JSON 401
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    // Page routes redirect to login
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
