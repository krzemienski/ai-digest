import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries, sources } from "@ai-digest/db";
import type { DiscoveryCandidate, SourceConfig } from "@ai-digest/shared";

type NewSource = typeof sources.$inferInsert;

const addCandidatesSchema = z.object({
  runId: z.string().uuid(),
  candidateIndices: z.array(z.number().int().min(0)),
});

function candidateToSource(candidate: DiscoveryCandidate): NewSource {
  return {
    name: candidate.name,
    type: candidate.type,
    config: candidate.config as SourceConfig,
    enabled: true,
  };
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as unknown;
    const parsed = addCandidatesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const run = await queries.getDiscoveryRun(db, parsed.data.runId);
    if (!run) {
      return NextResponse.json(
        { success: false, error: "Discovery run not found" },
        { status: 404 },
      );
    }

    const candidates = (run.candidates ?? []) as DiscoveryCandidate[];
    if (candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Discovery run has no candidates" },
        { status: 400 },
      );
    }

    // Validate indices and extract selected candidates
    const validIndices = parsed.data.candidateIndices.filter(
      (i) => i >= 0 && i < candidates.length,
    );

    if (validIndices.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid candidate indices provided" },
        { status: 400 },
      );
    }

    const selectedCandidates = validIndices.map((i) => candidates[i] as DiscoveryCandidate);
    const newSources = selectedCandidates.map(candidateToSource);

    const result = await queries.bulkCreateSources(db, newSources);

    // Update discovery run with added source IDs
    const existingAdded = run.addedSourceIds ?? [];
    await queries.updateDiscoveryRun(db, parsed.data.runId, {
      addedSourceIds: [...existingAdded, ...selectedCandidates.map((c) => c.name)],
    });

    return NextResponse.json({
      success: true,
      data: { added: result.added, skipped: result.skipped },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
