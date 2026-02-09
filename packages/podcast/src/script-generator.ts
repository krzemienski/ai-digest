import Anthropic from "@anthropic-ai/sdk";
import {
  buildToolLoopSystemPrompt,
  buildPodcastScriptPrompt,
  CHARS_PER_SECOND,
  getModelById,
  type PodcastTopicItem,
} from "@ai-digest/agents";
import type { ScriptSegment } from "./script-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScriptGeneratorOptions {
  stories: PodcastTopicItem[];
  targetDurationMinutes: number;
  model: string;
  style: string;
  customStylePrompt?: string | null;
  apiKey?: string;
  digestDate: string;
  onProgress?: (stage: string, message: string, meta?: Record<string, unknown>) => void;
  maxTurns?: number;
  maxBudgetUsd?: number;
}

export interface ScriptGeneratorResult {
  segments: ScriptSegment[];
  totalDuration: number;
  totalCharacters: number;
  cost: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    estimatedCostUsd: number;
  };
  turns: number;
  systemPrompt: string;
  userPrompt: string;
}

// ---------------------------------------------------------------------------
// Tool definitions (JSON Schema for Anthropic API)
// ---------------------------------------------------------------------------

interface SaveSectionInput {
  sectionName: string;
  segments: Array<{ speaker: string; text: string }>;
}

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_stories",
    description:
      "Retrieve all available stories for this episode with their titles, sources, summaries, topics, and scores. Call this first to plan your episode content.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "save_section",
    description:
      "Save a section of dialogue to the episode. Each section should contain 6-15 segments of alternating dialogue between Host A and Host B. Returns cumulative duration and remaining seconds.",
    input_schema: {
      type: "object",
      properties: {
        sectionName: {
          type: "string",
          description:
            'Name of this section (e.g. "cold_open", "intro", "segment_1", "closing")',
        },
        segments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: {
                type: "string",
                enum: ["Host A", "Host B"],
                description: "The speaker for this segment",
              },
              text: {
                type: "string",
                description:
                  "The spoken dialogue text. Write LONG segments (3-8 sentences, 200-800 characters). More text = longer audio.",
              },
            },
            required: ["speaker", "text"],
          },
          description: "Array of dialogue segments for this section",
        },
      },
      required: ["sectionName", "segments"],
    },
  },
  {
    name: "get_progress",
    description:
      "Check current episode progress. Returns total duration written so far, target duration, percentage complete, and remaining seconds. Call this after each save_section.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "finalize_script",
    description:
      "Finalize and assemble the complete episode from all saved sections. Call this ONLY when get_progress shows ≥100% of target duration. Returns the final ordered segment array.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor (closure over mutable state)
// ---------------------------------------------------------------------------

interface ToolState {
  stories: PodcastTopicItem[];
  savedSections: Array<{ name: string; segments: Array<{ speaker: string; text: string }> }>;
  globalOrderCounter: number;
  targetSeconds: number;
}

function estimateDuration(text: string): number {
  return text.length / CHARS_PER_SECOND;
}

function computeTotalDuration(state: ToolState): number {
  let total = 0;
  for (const section of state.savedSections) {
    for (const seg of section.segments) {
      total += estimateDuration(seg.text);
    }
  }
  return total;
}

function computeTotalCharacters(state: ToolState): number {
  let total = 0;
  for (const section of state.savedSections) {
    for (const seg of section.segments) {
      total += seg.text.length;
    }
  }
  return total;
}

function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  state: ToolState,
): string {
  switch (toolName) {
    case "get_stories": {
      return JSON.stringify({
        stories: state.stories.map((s) => ({
          title: s.title,
          source: s.source,
          summary: s.summary,
          topics: s.topics,
          score: s.compositeScore,
        })),
        totalStories: state.stories.length,
        targetDurationSeconds: state.targetSeconds,
        targetDurationMinutes: Math.round(state.targetSeconds / 60),
      });
    }

    case "save_section": {
      const input = toolInput as unknown as SaveSectionInput;
      state.savedSections.push({
        name: input.sectionName,
        segments: input.segments,
      });

      const totalDuration = computeTotalDuration(state);
      const remaining = state.targetSeconds - totalDuration;
      const sectionChars = input.segments.reduce((sum, s) => sum + s.text.length, 0);
      const sectionDuration = sectionChars / CHARS_PER_SECOND;

      return JSON.stringify({
        saved: true,
        sectionName: input.sectionName,
        sectionSegments: input.segments.length,
        sectionCharacters: sectionChars,
        sectionDurationSeconds: Math.round(sectionDuration),
        cumulativeDurationSeconds: Math.round(totalDuration),
        targetDurationSeconds: state.targetSeconds,
        remainingSeconds: Math.round(remaining),
        percentComplete: Math.round((totalDuration / state.targetSeconds) * 100),
      });
    }

    case "get_progress": {
      const totalDuration = computeTotalDuration(state);
      const totalChars = computeTotalCharacters(state);
      const remaining = state.targetSeconds - totalDuration;

      return JSON.stringify({
        totalDurationSeconds: Math.round(totalDuration),
        totalCharacters: totalChars,
        targetDurationSeconds: state.targetSeconds,
        remainingSeconds: Math.round(remaining),
        percentComplete: Math.round((totalDuration / state.targetSeconds) * 100),
        sectionsWritten: state.savedSections.length,
        segmentsWritten: state.savedSections.reduce((sum, s) => sum + s.segments.length, 0),
        readyToFinalize: totalDuration >= state.targetSeconds,
      });
    }

    case "finalize_script": {
      const allSegments: ScriptSegment[] = [];
      let order = 1;

      for (const section of state.savedSections) {
        for (const seg of section.segments) {
          allSegments.push({
            order,
            speaker: seg.speaker,
            text: seg.text.trim(),
            estimatedDuration: Math.round(estimateDuration(seg.text)),
          });
          order++;
        }
      }

      const totalDuration = allSegments.reduce((sum, s) => sum + s.estimatedDuration, 0);
      const totalChars = allSegments.reduce((sum, s) => sum + s.text.length, 0);

      return JSON.stringify({
        finalized: true,
        totalSegments: allSegments.length,
        totalDurationSeconds: totalDuration,
        totalCharacters: totalChars,
        targetDurationSeconds: state.targetSeconds,
        percentOfTarget: Math.round((totalDuration / state.targetSeconds) * 100),
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ---------------------------------------------------------------------------
// Cost calculation
// ---------------------------------------------------------------------------

function computeApiCost(
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheCreationTokens: number,
  modelId: string,
): number {
  const model = getModelById(modelId);
  const inputRate = model?.inputCostPer1M ?? 1.0; // Haiku default
  const outputRate = model?.outputCostPer1M ?? 5.0;

  // Cache reads are 10% of input price, cache creation is 25% more than input
  const cacheReadRate = inputRate * 0.1;
  const cacheCreationRate = inputRate * 1.25;

  // Non-cached input tokens = total input - cache reads - cache creation
  const regularInput = Math.max(0, inputTokens - cacheReadTokens - cacheCreationTokens);

  return (
    (regularInput * inputRate +
      cacheReadTokens * cacheReadRate +
      cacheCreationTokens * cacheCreationRate +
      outputTokens * outputRate) /
    1_000_000
  );
}

// ---------------------------------------------------------------------------
// Main: generateScriptWithTools
// ---------------------------------------------------------------------------

export async function generateScriptWithTools(
  options: ScriptGeneratorOptions,
): Promise<ScriptGeneratorResult> {
  const {
    stories,
    targetDurationMinutes,
    model: modelId,
    style,
    customStylePrompt,
    apiKey,
    digestDate,
    onProgress,
    maxTurns = 40,
    maxBudgetUsd = 5,
  } = options;

  // Build prompts
  const systemPrompt = buildToolLoopSystemPrompt(targetDurationMinutes, style, customStylePrompt);
  const userPrompt = buildPodcastScriptPrompt({
    digestDate,
    synthesis: `Top ${stories.length} AI stories for ${digestDate}`,
    items: stories,
    targetDurationMinutes,
  });

  // Init Anthropic client
  const clientOptions: Record<string, unknown> = {};
  if (apiKey) {
    clientOptions["apiKey"] = apiKey;
  }
  const client = new Anthropic(clientOptions as ConstructorParameters<typeof Anthropic>[0]);

  // Closure state for tool execution
  const state: ToolState = {
    stories,
    savedSections: [],
    globalOrderCounter: 1,
    targetSeconds: targetDurationMinutes * 60,
  };

  // Conversation messages
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  // Token tracking
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreationTokens = 0;

  onProgress?.("script_gen", "Starting tool loop script generation", {
    model: modelId,
    targetDurationMinutes,
    targetChars: Math.round(targetDurationMinutes * 60 * CHARS_PER_SECOND),
    maxTurns,
  });

  let turn = 0;
  for (turn = 0; turn < maxTurns; turn++) {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 16384,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: TOOL_DEFINITIONS as Anthropic.Tool[],
      messages,
    });

    // Track tokens
    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;
    // Cache tokens from response usage (Anthropic provides these as extended fields)
    const usage = response.usage as unknown as Record<string, number>;
    totalCacheReadTokens += usage["cache_read_input_tokens"] ?? 0;
    totalCacheCreationTokens += usage["cache_creation_input_tokens"] ?? 0;

    // Check budget
    const currentCost = computeApiCost(
      totalInputTokens,
      totalOutputTokens,
      totalCacheReadTokens,
      totalCacheCreationTokens,
      modelId,
    );
    if (currentCost > maxBudgetUsd) {
      onProgress?.("script_gen", `Budget exceeded ($${currentCost.toFixed(2)} > $${maxBudgetUsd}), stopping`);
      break;
    }

    // Add assistant response to conversation
    messages.push({ role: "assistant", content: response.content });

    // If no tool use, we're done
    if (response.stop_reason !== "tool_use") {
      onProgress?.("script_gen", `Tool loop completed after ${turn + 1} turns (stop_reason: ${response.stop_reason})`);
      break;
    }

    // Execute each tool call and build results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const result = executeTool(block.name, block.input as Record<string, unknown>, state);

      onProgress?.("script_gen", `Tool: ${block.name}`, {
        turn: turn + 1,
        toolName: block.name,
        result: JSON.parse(result),
      });

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  // Assemble final segments from state
  const segments: ScriptSegment[] = [];
  let order = 1;
  for (const section of state.savedSections) {
    for (const seg of section.segments) {
      segments.push({
        order,
        speaker: seg.speaker,
        text: seg.text.trim(),
        estimatedDuration: Math.round(estimateDuration(seg.text)),
      });
      order++;
    }
  }

  const totalCharacters = segments.reduce((sum, s) => sum + s.text.length, 0);
  const totalDuration = segments.reduce((sum, s) => sum + s.estimatedDuration, 0);

  const finalCost = computeApiCost(
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheCreationTokens,
    modelId,
  );

  onProgress?.("script_gen", `Script generation complete`, {
    segments: segments.length,
    totalCharacters,
    totalDurationSeconds: totalDuration,
    targetDurationSeconds: targetDurationMinutes * 60,
    percentOfTarget: Math.round((totalDuration / (targetDurationMinutes * 60)) * 100),
    turns: turn + 1,
    cost: finalCost,
  });

  return {
    segments,
    totalDuration,
    totalCharacters,
    cost: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cacheReadTokens: totalCacheReadTokens,
      cacheCreationTokens: totalCacheCreationTokens,
      estimatedCostUsd: finalCost,
    },
    turns: turn + 1,
    systemPrompt,
    userPrompt,
  };
}
