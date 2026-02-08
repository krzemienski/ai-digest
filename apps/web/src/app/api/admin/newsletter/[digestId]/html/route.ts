import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries } from "@ai-digest/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ digestId: string }> }
) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const { digestId } = await params;
    const digestWithItems = await queries.getDigestWithItems(db, digestId);

    if (!digestWithItems) {
      return NextResponse.json(
        { success: false, error: "Digest not found" },
        { status: 404 }
      );
    }

    // Build items HTML
    const itemsHtml = digestWithItems.items.map(item => `
      <div style="padding: 16px 0; border-bottom: 1px solid #3F3F46;">
        <h3 style="color: #FAFAFA; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${escapeHtml(item.title)}</h3>
        <p style="color: #A1A1AA; margin: 0 0 8px 0; font-size: 14px;">${escapeHtml(item.summary ?? "")}</p>
        <p style="color: #71717A; margin: 0; font-size: 12px;">
          <a href="${escapeHtml(item.sourceUrl ?? "#")}" style="color: #3B82F6; text-decoration: none;">View article</a>
          ${item.source ? ` • ${escapeHtml(item.source)}` : ""}
        </p>
      </div>
    `).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Digest - ${escapeHtml(digestWithItems.digestDate)}</title>
</head>
<body style="background: #09090B; color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 0;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #FAFAFA; font-size: 24px; font-weight: 700; border-bottom: 2px solid #3B82F6; padding-bottom: 12px; margin-top: 0;">AI Digest</h1>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 16px 0;">Digest Date: ${escapeHtml(digestWithItems.digestDate)}</p>

    <div style="margin-bottom: 24px; padding: 16px; background: #18181B; border-radius: 8px; border-left: 4px solid #3B82F6;">
      <h2 style="color: #FAFAFA; font-size: 14px; font-weight: 600; margin-top: 0;">Summary</h2>
      <p style="color: #A1A1AA; margin: 0; line-height: 1.6; font-size: 14px;">${escapeHtml(digestWithItems.synthesis)}</p>
    </div>

    <h2 style="color: #FAFAFA; font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 16px;">Stories (${digestWithItems.items.length})</h2>
    ${itemsHtml}

    <footer style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #3F3F46; color: #71717A; font-size: 12px; text-align: center;">
      <p style="margin: 0;">AI Digest Newsletter &mdash; Powered by AI Digest</p>
    </footer>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
