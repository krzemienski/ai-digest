import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { z } from "zod";

const unsubscribeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

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
