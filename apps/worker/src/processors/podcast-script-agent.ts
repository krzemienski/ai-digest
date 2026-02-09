import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { SDKResultMessage, SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ScriptSegment } from "@ai-digest/podcast";
import type { PodcastStyle } from "@ai-digest/shared";
import { buildAgentSystemPrompt } from "@ai-digest/agents";
import type { LogEmitter } from "../lib/log-emitter";

/**
 * A story item with full content for the agent to analyze.
 */
export interface AgentStoryItem {
  readonly title: string;
  readonly summary: string;
  readonly content: string | null;
  readonly source: string;
  readonly authors: string[];
  readonly topics: string[];
  readonly compositeScore: number;
}

/**
 * A saved section of dialogue segments from the agent.
 */
interface SavedSection {
  readonly sectionName: string;
  readonly segments: ScriptSegment[];
}

/**
 * Result from the agent script generation.
 */
export interface AgentScriptResult {
  readonly segments: ScriptSegment[];
  readonly totalCostUsd: number;
  readonly numTurns: number;
  readonly durationMs: number;
  readonly systemPrompt: string;
  readonly agentPrompt: string;
}

/**
 * Creates an in-process MCP server with 4 custom tools for the podcast script-writing agent.
 *
 * The tools maintain closure over the story data and accumulated sections,
 * allowing the agent to iteratively build a script section-by-section.
 */
function createPodcastToolServer(
  stories: readonly AgentStoryItem[],
  targetDurationSeconds: number,
) {
  // Mutable accumulator — sections are appended as the agent saves them
  const savedSections: SavedSection[] = [];
  let globalOrderCounter = 0;

  const getStoriesT = tool(
    "get_stories",
    "Retrieve all available stories for this episode with their full content, metadata, and relevance scores. Call this first to understand what material you have to work with.",
    {},
    async () => {
      const formatted = stories.map((s, i) => ({
        index: i + 1,
        title: s.title,
        source: s.source,
        authors: s.authors,
        topics: s.topics,
        compositeScore: s.compositeScore,
        summary: s.summary,
        content: s.content ?? s.summary,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            storyCount: stories.length,
            stories: formatted,
          }, null, 2),
        }],
      };
    }
  );

  const saveSectionT = tool(
    "save_section",
    "Save a completed dialogue section. Each section is a named group of sequential dialogue segments between Host A and Host B. Call this after writing each section (intro, topic segment, transition, recap, outro, etc.).",
    {
      sectionName: z.string().describe("Name of the section, e.g. 'intro', 'segment_1_transformers', 'mid_recap', 'outro'"),
      segments: z.array(z.object({
        speaker: z.string().describe("Either 'Host A' or 'Host B'"),
        text: z.string().describe("The spoken dialogue text — write long, detailed, conversational segments. Each segment should be 3-6 sentences (200-600 characters). More text = longer audio."),
      })).describe("Array of dialogue segments for this section"),
    },
    async (args) => {
      // Calculate duration from text length — calibrated to ElevenLabs TTS at ~14.5 chars/second
      const CHARS_PER_SECOND = 14.5;

      const sectionSegments: ScriptSegment[] = args.segments.map((seg) => {
        globalOrderCounter = globalOrderCounter + 1;
        return {
          order: globalOrderCounter,
          speaker: seg.speaker,
          text: seg.text,
          estimatedDuration: Math.round(seg.text.length / CHARS_PER_SECOND),
        };
      });

      savedSections.push({
        sectionName: args.sectionName,
        segments: sectionSegments,
      });

      const totalDuration = savedSections.reduce(
        (sum, sec) => sum + sec.segments.reduce((s, seg) => s + seg.estimatedDuration, 0),
        0,
      );

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            saved: true,
            sectionName: args.sectionName,
            segmentCount: sectionSegments.length,
            sectionDuration: sectionSegments.reduce((s, seg) => s + seg.estimatedDuration, 0),
            cumulativeDuration: totalDuration,
            targetDuration: targetDurationSeconds,
            remaining: targetDurationSeconds - totalDuration,
            sectionsCount: savedSections.length,
          }),
        }],
      };
    }
  );

  const getProgressT = tool(
    "get_progress",
    "Check current progress: how many sections saved, cumulative duration, target duration, and remaining time needed. Use this after each save_section call to track your pacing.",
    {},
    async () => {
      const totalDuration = savedSections.reduce(
        (sum, sec) => sum + sec.segments.reduce((s, seg) => s + seg.estimatedDuration, 0),
        0,
      );
      const totalSegments = savedSections.reduce(
        (sum, sec) => sum + sec.segments.length,
        0,
      );

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            sectionsCount: savedSections.length,
            sectionNames: savedSections.map(s => s.sectionName),
            totalSegments,
            totalDurationSeconds: totalDuration,
            targetDurationSeconds,
            remainingSeconds: targetDurationSeconds - totalDuration,
            percentComplete: Math.round((totalDuration / targetDurationSeconds) * 100),
            onTrack: totalDuration >= targetDurationSeconds * 0.9,
          }),
        }],
      };
    }
  );

  const finalizeScriptT = tool(
    "finalize_script",
    "Assemble all saved sections into the final podcast script. Validates total duration meets the target. Call this exactly once when all sections have been saved and get_progress shows you've met the target duration.",
    {},
    async () => {
      const allSegments = savedSections.flatMap(s => s.segments);
      const totalDuration = allSegments.reduce((s, seg) => s + seg.estimatedDuration, 0);

      if (allSegments.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ error: "No sections saved. Use save_section first." }),
          }],
          isError: true,
        };
      }

      const durationWarning = totalDuration < targetDurationSeconds * 0.85
        ? `Warning: total duration ${totalDuration}s is below target ${targetDurationSeconds}s. Consider adding more content.`
        : null;

      // Reorder segments sequentially 1..N
      const ordered = allSegments.map((seg, idx) => ({
        ...seg,
        order: idx + 1,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            finalized: true,
            totalSegments: ordered.length,
            totalDurationSeconds: totalDuration,
            targetDurationSeconds,
            durationWarning,
            segments: ordered,
          }),
        }],
      };
    }
  );

  return {
    server: createSdkMcpServer({
      name: "podcast",
      version: "1.0.0",
      tools: [getStoriesT, saveSectionT, getProgressT, finalizeScriptT],
    }),
    getSavedSections: () => savedSections,
  };
}

/**
 * Generate a podcast script using the Claude Agent SDK.
 *
 * Runs an autonomous agent loop that:
 * 1. Researches stories via get_stories tool
 * 2. Plans episode outline
 * 3. Writes sections incrementally via save_section tool
 * 4. Checks progress via get_progress tool
 * 5. Finalizes the script via finalize_script tool
 */
export async function generateScriptWithAgent(
  stories: readonly AgentStoryItem[],
  config: {
    readonly targetDurationMinutes: number;
    readonly model: string;
    readonly style: PodcastStyle;
    readonly customStylePrompt?: string | null;
    readonly maxTurns?: number;
    readonly maxBudgetUsd?: number;
  },
  log?: LogEmitter,
): Promise<AgentScriptResult> {
  const targetDurationSeconds = config.targetDurationMinutes * 60;

  const { server: podcastServer, getSavedSections } = createPodcastToolServer(
    stories,
    targetDurationSeconds,
  );

  const systemPrompt = buildAgentSystemPrompt(
    config.style,
    config.customStylePrompt,
  );

  const agentPrompt = `Generate a ${config.targetDurationMinutes}-minute podcast episode covering ${stories.length} AI stories for today's episode.

Target duration: ${targetDurationSeconds} seconds (${config.targetDurationMinutes} minutes).

Start by calling get_stories to see all available material, then plan your outline, then write each section using save_section, check your progress with get_progress after each section, and finish with finalize_script.`;

  // Custom MCP tools require streaming input mode (async generator)
  async function* generateMessages(): AsyncGenerator<SDKUserMessage> {
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: agentPrompt,
      },
      parent_tool_use_id: null,
      session_id: "",
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set — required for Agent SDK podcast generation");
  }

  await log?.emit("script_gen", "info", "Starting Agent SDK script generation", {
    model: config.model,
    targetMinutes: config.targetDurationMinutes,
    targetSeconds: targetDurationSeconds,
    storyCount: stories.length,
    maxTurns: config.maxTurns ?? 40,
    maxBudgetUsd: config.maxBudgetUsd ?? 25.0,
  });

  let resultMessage: SDKResultMessage | null = null;

  // Capture stderr for debugging subprocess failures
  const stderrChunks: string[] = [];

  for await (const message of query({
    prompt: generateMessages(),
    options: {
      model: config.model,
      systemPrompt,
      maxTurns: config.maxTurns ?? 40,
      maxBudgetUsd: config.maxBudgetUsd ?? 25.0,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      // Isolate from user hooks/settings — run headless
      settingSources: [],
      persistSession: false,
      // Only expose our MCP tools, no built-in tools needed
      tools: [],
      mcpServers: {
        podcast: podcastServer,
      },
      allowedTools: [
        "mcp__podcast__get_stories",
        "mcp__podcast__save_section",
        "mcp__podcast__get_progress",
        "mcp__podcast__finalize_script",
      ],
      // Force API key auth instead of OAuth by passing clean env
      env: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        NODE_PATH: process.env.NODE_PATH ?? "",
      },
      // Capture subprocess stderr for debugging
      stderr: (data: string) => {
        stderrChunks.push(data);
        log?.emit("script_gen", "info", `Agent stderr: ${data.trim()}`, {}).catch(() => {});
      },
    },
  })) {
    // Log tool calls for real-time progress
    if (message.type === "assistant" && "message" in message && message.message?.content) {
      for (const block of message.message.content) {
        if ("name" in block && typeof block.name === "string" && block.name.startsWith("mcp__podcast__")) {
          const toolName = block.name.replace("mcp__podcast__", "");
          await log?.emit("script_gen", "info", `Agent tool call: ${toolName}`, {
            tool: toolName,
          });
        }
      }
    }

    // Capture the final result message
    if (message.type === "result") {
      resultMessage = message as SDKResultMessage;
    }
  }

  if (!resultMessage) {
    const stderrOutput = stderrChunks.join("").trim();
    throw new Error(
      `Agent SDK query completed without a result message.${stderrOutput ? ` Stderr: ${stderrOutput.slice(0, 2000)}` : ""}`
    );
  }

  // Log errors/warnings for non-success results
  if (resultMessage.subtype !== "success") {
    const errorResult = resultMessage;
    await log?.emit("script_gen", "warn", `Agent completed with status: ${errorResult.subtype}`, {
      subtype: errorResult.subtype,
      errors: errorResult.errors.join("; "),
    });
  }

  // Extract segments from saved sections (the agent should have called save_section multiple times)
  const sections = getSavedSections();

  if (sections.length === 0) {
    throw new Error("Agent completed but saved no sections. Script generation failed.");
  }

  const allSegments = sections.flatMap(s => s.segments);

  // Reorder globally 1..N
  const orderedSegments: ScriptSegment[] = allSegments.map((seg, idx) => ({
    ...seg,
    order: idx + 1,
  }));

  const totalDuration = orderedSegments.reduce((s, seg) => s + seg.estimatedDuration, 0);

  const totalCostUsd = resultMessage.total_cost_usd;
  const numTurns = resultMessage.num_turns;
  const durationMs = resultMessage.duration_ms;

  await log?.emit("script_gen", "info", `Agent script complete: ${orderedSegments.length} segments, ${totalDuration}s duration, ${sections.length} sections`, {
    segmentCount: orderedSegments.length,
    totalDurationSeconds: totalDuration,
    sectionsCount: sections.length,
    sectionNames: sections.map(s => s.sectionName),
    agentCostUsd: totalCostUsd,
    agentTurns: numTurns,
    agentDurationMs: durationMs,
  });

  return {
    segments: orderedSegments,
    totalCostUsd,
    numTurns,
    durationMs,
    systemPrompt,
    agentPrompt,
  };
}
