import { NextRequest } from "next/server";
import IORedis from "ioredis";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries } from "@ai-digest/db";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  const episodeId = request.nextUrl.searchParams.get("episodeId");
  if (!episodeId) {
    return new Response(JSON.stringify({ error: "episodeId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const subscriber = new IORedis(REDIS_URL);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Backfill existing logs from DB
      void (async () => {
        try {
          const existingLogs = await queries.getLogsByEpisode(db, episodeId);
          // Sort ascending (oldest first) for backfill
          const sorted = [...existingLogs].reverse();
          for (const log of sorted) {
            const data = JSON.stringify({
              type: "log",
              id: log.id,
              episodeId: log.episodeId,
              stage: log.stage,
              severity: log.severity,
              message: log.message,
              metadata: log.metadata,
              createdAt: log.createdAt.toISOString(),
            });
            controller.enqueue(encoder.encode(`event: log\ndata: ${data}\n\n`));
          }
          // Signal backfill complete
          controller.enqueue(
            encoder.encode(`event: backfill_complete\ndata: ${JSON.stringify({ count: sorted.length })}\n\n`)
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`)
          );
        }
      })();

      // Subscribe to real-time updates
      const channel = `podcast:${episodeId}:logs`;
      void subscriber.subscribe(channel);

      subscriber.on("message", (_ch: string, message: string) => {
        try {
          const parsed = JSON.parse(message) as { type?: string };
          const eventType = parsed.type ?? "log";
          controller.enqueue(encoder.encode(`event: ${eventType}\ndata: ${message}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`event: log\ndata: ${message}\n\n`));
        }
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        void subscriber.unsubscribe(channel);
        void subscriber.quit();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
