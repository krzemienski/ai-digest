import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries, digests, eq } from "@ai-digest/db";
import { getModelById, MODEL_REGISTRY } from "@ai-digest/agents";
import { processPodcastInline } from "@/lib/processors/podcast";

export const maxDuration = 800;

const voiceSettingsSchema = z.object({
  stability: z.number().min(0).max(1),
  similarityBoost: z.number().min(0).max(1),
  speed: z.number().min(0.5).max(2),
  style: z.number().min(0).max(1),
});

const speakerVoiceSchema = z.object({
  role: z.string(),
  voiceId: z.string(),
  settings: voiceSettingsSchema,
});

const voiceConfigSchema = z.object({
  speakers: z.array(speakerVoiceSchema).min(1).max(4),
  audioFormat: z.string().default("mp3_44100_128"),
  targetDurationMinutes: z.number().default(10),
});

const dateRangeSchema = z.object({
  start: z.string().datetime({ message: "start must be an ISO 8601 datetime string" }),
  end: z.string().datetime({ message: "end must be an ISO 8601 datetime string" }),
});

const generateSchema = z.object({
  digestId: z.string().uuid().optional(),
  dateRange: dateRangeSchema.optional(),
  targetDurationMinutes: z.coerce.number().pipe(
    z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(25), z.literal(30), z.literal(45), z.literal(60)])
  ),
  model: z.string().optional(),
  voiceConfig: voiceConfigSchema.optional(),
  style: z.string().optional(),
  customStylePrompt: z.string().max(2000).optional(),
});

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

    const { digestId, dateRange } = parsed.data;

    // XOR validation: exactly one of digestId or dateRange must be provided
    if (digestId && dateRange) {
      return NextResponse.json(
        { success: false, error: "Provide either digestId or dateRange, not both" },
        { status: 400 }
      );
    }
    if (!digestId && !dateRange) {
      return NextResponse.json(
        { success: false, error: "Either digestId or dateRange is required" },
        { status: 400 }
      );
    }

    // Validate date range ordering when provided
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      if (startDate >= endDate) {
        return NextResponse.json(
          { success: false, error: "dateRange.start must be before dateRange.end" },
          { status: 400 }
        );
      }
    }

    // Validate model if provided
    if (parsed.data.model) {
      const modelInfo = getModelById(parsed.data.model);
      if (!modelInfo) {
        const validModels = MODEL_REGISTRY.map(m => m.id).join(", ");
        return NextResponse.json(
          { success: false, error: `Unknown model: ${parsed.data.model}. Valid models: ${validModels}` },
          { status: 400 }
        );
      }
    }

    let episodeTitle: string;
    let episodeDigestId: string | null = null;
    let episodeDateRangeStart: Date | null = null;
    let episodeDateRangeEnd: Date | null = null;

    if (digestId) {
      // Digest-based generation: verify digest exists
      const digest = await db.query.digests.findFirst({
        where: eq(digests.id, digestId as string),
      });
      if (!digest) {
        return NextResponse.json(
          { success: false, error: "Digest not found" },
          { status: 404 }
        );
      }
      episodeTitle = `AI Digest Podcast — ${digest.digestDate}`;
      episodeDigestId = digestId;
    } else {
      // Time-window-based generation
      const startDate = new Date(dateRange!.start);
      const endDate = new Date(dateRange!.end);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      episodeTitle = `AI Digest Podcast — ${fmt(startDate)} to ${fmt(endDate)}`;
      episodeDateRangeStart = startDate;
      episodeDateRangeEnd = endDate;
    }

    // Create episode record
    const episode = await queries.createEpisode(db, {
      digestId: episodeDigestId,
      dateRangeStart: episodeDateRangeStart,
      dateRangeEnd: episodeDateRangeEnd,
      title: episodeTitle,
      status: "generating",
      targetDurationMinutes: parsed.data.targetDurationMinutes,
      model: parsed.data.model,
      style: parsed.data.style,
      customStylePrompt: parsed.data.customStylePrompt,
      voiceConfig: parsed.data.voiceConfig,
      podcastStages: INITIAL_STAGES,
    });

    // Run podcast generation synchronously within the 800s serverless timeout.
    // Podcast generation typically takes 5-10 minutes, fitting within the limit.
    try {
      await processPodcastInline({
        episodeId: episode.id,
        digestId: episodeDigestId,
        targetDurationMinutes: parsed.data.targetDurationMinutes,
        model: parsed.data.model,
        voiceConfig: parsed.data.voiceConfig,
        style: parsed.data.style,
        customStylePrompt: parsed.data.customStylePrompt,
        dateRange: dateRange ?? undefined,
      });

      return NextResponse.json({
        success: true,
        data: { episodeId: episode.id, status: "ready" },
      }, { status: 201 });
    } catch (genError) {
      console.error("[Podcast] Generation failed:", genError);
      return NextResponse.json({
        success: true,
        data: { episodeId: episode.id, status: "failed", error: genError instanceof Error ? genError.message : String(genError) },
      }, { status: 201 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
