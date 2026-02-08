import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth needed
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // Admin pages: check for session cookie presence (actual validation in route handlers)
  const sessionCookie = request.cookies.get("ai-digest-session");

  if (pathname.startsWith("/api/admin")) {
    const authHeader = request.headers.get("Authorization");
    if (!sessionCookie && !authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
