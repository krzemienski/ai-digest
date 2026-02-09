import { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries, episodes, eq } from "@ai-digest/db";

export const maxDuration = 800;

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastLogId: string | null = null;
      let pollInterval: ReturnType<typeof setInterval> | null = null;
      let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
      let closed = false;

      const cleanup = () => {
        closed = true;
        if (pollInterval) clearInterval(pollInterval);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      const enqueue = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanup();
        }
      };

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
            enqueue(`event: log\ndata: ${data}\n\n`);
            lastLogId = log.id;
          }
          // Signal backfill complete
          enqueue(`event: backfill_complete\ndata: ${JSON.stringify({ count: sorted.length })}\n\n`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          enqueue(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
        }

        // Start polling for new logs every 2 seconds
        pollInterval = setInterval(() => {
          void (async () => {
            if (closed) return;
            try {
              const allLogs = await queries.getLogsByEpisode(db, episodeId);
              // getLogsByEpisode returns desc order, reverse to asc
              const sorted = [...allLogs].reverse();

              // Find new logs after lastLogId
              let foundLast = lastLogId === null;
              for (const log of sorted) {
                if (!foundLast) {
                  if (log.id === lastLogId) foundLast = true;
                  continue;
                }
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
                enqueue(`event: log\ndata: ${data}\n\n`);
                lastLogId = log.id;
              }

              // Check if episode is done
              const episode = await db.query.episodes.findFirst({
                where: eq(episodes.id, episodeId),
                columns: { status: true },
              });
              if (episode && (episode.status === "ready" || episode.status === "failed")) {
                enqueue(`event: complete\ndata: ${JSON.stringify({ status: episode.status })}\n\n`);
                cleanup();
              }
            } catch {
              // Polling error — non-fatal, retry on next interval
            }
          })();
        }, 2000);
      })();

      // Heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        enqueue(`: heartbeat\n\n`);
      }, 15_000);

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        cleanup();
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
