import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const validateSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest();
  if (authError) return authError;

  try {
    const body = await request.json() as unknown;
    const parsed = validateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid URL", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const response = await fetch(parsed.data.url, {
      headers: { "User-Agent": "AI-Digest/1.0 (RSS Validator)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch: HTTP ${response.status}` },
        { status: 400 }
      );
    }

    const text = await response.text();

    // Simple XML validation - check for RSS or Atom markers
    const isRss = text.includes("<rss") || text.includes("<channel>");
    const isAtom = text.includes("<feed") && text.includes("xmlns=\"http://www.w3.org/2005/Atom\"");

    if (!isRss && !isAtom) {
      return NextResponse.json(
        { success: false, error: "URL does not appear to be a valid RSS or Atom feed" },
        { status: 400 }
      );
    }

    // Extract title
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/);
    const descMatch = text.match(/<description[^>]*>([^<]+)<\/description>/) ||
                      text.match(/<subtitle[^>]*>([^<]+)<\/subtitle>/);

    // Extract last 3 item titles
    const itemTitles: string[] = [];
    const itemRegex = /<item[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>[\s\S]*?<\/item>/g;
    const entryRegex = /<entry[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>[\s\S]*?<\/entry>/g;

    let match;
    const regex = isAtom ? entryRegex : itemRegex;
    while ((match = regex.exec(text)) !== null && itemTitles.length < 3) {
      if (match[1]) itemTitles.push(match[1].trim());
    }

    return NextResponse.json({
      success: true,
      data: {
        type: isAtom ? "atom" : "rss",
        title: titleMatch?.[1]?.trim() ?? "Unknown",
        description: descMatch?.[1]?.trim() ?? "",
        recentItems: itemTitles,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
