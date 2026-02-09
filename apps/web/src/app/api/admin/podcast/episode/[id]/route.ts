import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries } from "@ai-digest/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const result = await queries.getEpisodeWithFullDetail(db, id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Episode not found" },
        { status: 404 }
      );
    }

    // Extract cost breakdown from promptsUsed if available
    const promptsUsed = result.promptsUsed as Record<string, unknown> | null;
    const costBreakdown = promptsUsed?.costBreakdown as {
      anthropicCost?: number;
      elevenlabsCost?: number;
      ttsCharacters?: number;
      totalCost?: number;
    } | undefined;

    return NextResponse.json({
      success: true,
      data: {
        episode: {
          id: result.id,
          digestId: result.digestId,
          title: result.title,
          status: result.status,
          audioUrl: result.audioUrl,
          durationSeconds: result.durationSeconds,
          targetDurationMinutes: result.targetDurationMinutes,
          model: result.model,
          style: result.style,
          customStylePrompt: result.customStylePrompt,
          costUsd: result.costUsd,
          costBreakdown: costBreakdown ?? null,
          configSnapshot: result.configSnapshot,
          promptsUsed: result.promptsUsed,
          qualityScores: result.qualityScores,
          podcastStages: result.podcastStages,
          scriptPreview: result.scriptPreview,
          createdAt: result.createdAt,
        },
        transcript: result.transcript,
        logs: result.logs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
