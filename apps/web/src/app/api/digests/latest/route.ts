import { NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";

export async function GET() {
  try {
    const digest = await queries.getLatestDigest(db);

    if (!digest) {
      return NextResponse.json(
        { success: false, error: "No digests found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: digest },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
