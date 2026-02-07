import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    await queries.createSubscriber(db, { email, status: "active" });

    return NextResponse.json(
      { success: true, data: { email } },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes("unique") || errorMessage.includes("duplicate")) {
      return NextResponse.json(
        { success: false, error: "Email already subscribed" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Subscription failed" },
      { status: 500 }
    );
  }
}
