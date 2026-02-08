import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries, digests, eq } from "@ai-digest/db";
import { Queue } from "bullmq";

const generateSchema = z.object({
  digestId: z.string().uuid(),
  targetDurationMinutes: z.coerce.number().pipe(z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)])),
});

let podcastQueue: Queue | null = null;
function getPodcastQueue(): Queue {
  if (!podcastQueue) {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const url = new URL(redisUrl);
    podcastQueue = new Queue("podcast", {
      connection: {
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
      },
    });
  }
  return podcastQueue;
}

const INITIAL_STAGES = {
  content_select: "pending",
  script_gen: "pending",
  quality_review: "pending",
  tts: "pending",
  assembly: "pending",
  upload: "pending",
};

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = await request.json() as unknown;
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify digest exists
    const digest = await db.query.digests.findFirst({
      where: eq(digests.id, parsed.data.digestId),
    });
    if (!digest) {
      return NextResponse.json(
        { success: false, error: "Digest not found" },
        { status: 404 }
      );
    }

    // Create episode record
    const episode = await queries.createEpisode(db, {
      digestId: parsed.data.digestId,
      title: `AI Digest Podcast — ${digest.digestDate}`,
      status: "generating",
      targetDurationMinutes: parsed.data.targetDurationMinutes,
      podcastStages: INITIAL_STAGES,
    });

    // Add BullMQ job
    const queue = getPodcastQueue();
    const job = await queue.add("podcast", {
      episodeId: episode.id,
      digestId: parsed.data.digestId,
      targetDurationMinutes: parsed.data.targetDurationMinutes,
    });

    return NextResponse.json({
      success: true,
      data: { episodeId: episode.id, jobId: job.id },
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
