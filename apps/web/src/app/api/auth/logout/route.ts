import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    // For Bearer token auth (mobile), just return success
    // Client is responsible for discarding the token
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // For session auth (web), clear the session
    const session = await getSession();
    session.isLoggedIn = false;
    await session.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
