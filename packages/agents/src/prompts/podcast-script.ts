export const PODCAST_SCRIPT_SYSTEM_PROMPT = `You are a professional podcast script writer creating an engaging AI/ML news discussion between two hosts.

Write a natural, conversational dialogue between Host A and Host B discussing the day's top AI stories.

Structure the script as:
1. **Intro** (30-60 seconds): Host A welcomes listeners, Host B teases the biggest story
2. **Main segments** (2-3 minutes each): Each covers a major topic cluster. Hosts discuss, react, explain implications.
3. **Transitions**: Natural segues between topics ("Speaking of infrastructure, there's also...")
4. **Outro** (30-60 seconds): Hosts summarize key takeaways, sign off

Guidelines:
- Host A is the "anchor" — introduces topics, asks probing questions
- Host B is the "analyst" — provides deeper context, makes connections, shares opinions
- Keep language accessible but technically accurate
- Reference specific stories by name/title
- Include moments of genuine reaction ("That's actually really impressive", "I didn't see that coming")
- Each segment should feel like a real conversation, not a news reading
- Aim for the target duration specified

Return a JSON array of segments, each with: order (number), speaker ("Host A" or "Host B"), text (the spoken words), estimatedDuration (seconds).`;

export interface PodcastScriptInput {
  digestDate: string;
  synthesis: string;
  items: PodcastTopicItem[];
  targetDurationMinutes: number;
}

export interface PodcastTopicItem {
  title: string;
  summary: string;
  source: string;
  topics: string[];
  compositeScore: number;
}

export interface PodcastScriptSegment {
  order: number;
  speaker: "Host A" | "Host B";
  text: string;
  estimatedDuration: number;
}

export function buildPodcastScriptPrompt(input: PodcastScriptInput): string {
  const itemsByTopic: Record<string, PodcastTopicItem[]> = {};
  for (const item of input.items) {
    for (const topic of item.topics) {
      const existing = itemsByTopic[topic] ?? [];
      itemsByTopic[topic] = [...existing, item];
    }
  }

  const topicSections = Object.entries(itemsByTopic).map(([topic, topicItems]) => {
    const itemList = topicItems.map(i =>
      `- [${i.source}] ${i.title} (score: ${i.compositeScore.toFixed(2)})\n  ${i.summary}`
    ).join("\n");
    return `### ${topic}\n${itemList}`;
  }).join("\n\n");

  return `## Podcast Script Request

**Date**: ${input.digestDate}
**Target Duration**: ${input.targetDurationMinutes} minutes

## Editorial Summary
${input.synthesis}

## Stories by Topic
${topicSections}

Generate a natural podcast dialogue covering these stories. Return a JSON array of {order, speaker, text, estimatedDuration} segments.`;
}

export const PODCAST_SCRIPT_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    segments: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          order: { type: "number" as const },
          speaker: { type: "string" as const, enum: ["Host A", "Host B"] },
          text: { type: "string" as const },
          estimatedDuration: { type: "number" as const },
        },
        required: ["order", "speaker", "text", "estimatedDuration"],
      },
    },
  },
  required: ["segments"],
};

export const STYLE_PRESETS: Readonly<Record<string, string>> = {
  professional: "Maintain a polished, authoritative tone. Use industry terminology precisely. Structure discussions with clear thesis statements and supporting evidence.",
  casual: "Keep the conversation relaxed and approachable. Use everyday language, occasional humor, and relatable analogies. Feel free to express genuine reactions and personal opinions.",
  technical: "Dive deep into technical details. Discuss implementation specifics, trade-offs, and architectural decisions. Assume the audience has an engineering background.",
  news_brief: "Be concise and punchy. Lead with the most impactful news. Keep segments short (30-60 seconds each). Focus on facts over analysis. Deliver maximum information density.",
};

export function buildStyledSystemPrompt(
  basePrompt: string,
  style: string,
  customPrompt?: string | null,
): string {
  const styleInstructions = style === "custom" && customPrompt
    ? customPrompt
    : STYLE_PRESETS[style] ?? STYLE_PRESETS["professional"]!;

  return `${basePrompt}\n\n## Style Instructions\n${styleInstructions}`;
}
