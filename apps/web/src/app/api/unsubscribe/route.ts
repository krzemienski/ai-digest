import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { z } from "zod";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { env } from "@/lib/env";

const unsubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request: email and token required" },
        { status: 400 }
      );
    }

    const { email, token } = parsed.data;

    const secret = env.UNSUBSCRIBE_SECRET;
    if (secret) {
      const valid = verifyUnsubscribeToken(email, token, secret);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Invalid unsubscribe token" },
          { status: 403 }
        );
      }
    }

    await queries.removeSubscriber(db, email);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unsubscribe failed" },
      { status: 500 }
    );
  }
}
