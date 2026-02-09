import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { estimateGenerationCost, getModelById } from "@ai-digest/agents";

const costEstimateSchema = z.object({
  model: z.string().min(1),
  targetDurationMinutes: z.coerce.number().pipe(
    z.union([
      z.literal(5), z.literal(10), z.literal(15), z.literal(20),
      z.literal(25), z.literal(30), z.literal(45), z.literal(60),
    ])
  ),
});

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as unknown;
    const parsed = costEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { model, targetDurationMinutes } = parsed.data;

    // Validate model exists in registry
    const modelInfo = getModelById(model);
    if (!modelInfo) {
      return NextResponse.json(
        { success: false, error: `Unknown model: ${model}` },
        { status: 400 }
      );
    }

    const estimate = estimateGenerationCost(model, targetDurationMinutes);

    // Warning for expensive models
    const warning =
      modelInfo.tier === "premium"
        ? `${modelInfo.name} costs ~${Math.round(modelInfo.outputCostPer1M / 5)}x more than Haiku. Estimated total: $${estimate.total.toFixed(2)}`
        : undefined;

    return NextResponse.json({
      success: true,
      data: {
        estimatedCost: estimate,
        model: { id: modelInfo.id, name: modelInfo.name, tier: modelInfo.tier },
        warning,
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
