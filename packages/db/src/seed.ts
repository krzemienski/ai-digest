import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import {
  sources,
  normalizedItems,
  digests,
  digestItems,
  episodes,
  transcripts,
  subscribers,
  pipelineRuns,
  pipelineStages,
  config,
} from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/ai_digest_dev";
const client = postgres(connectionString);
const db = drizzle(client);

// Deterministic UUIDs for idempotent seeding
const SEED_IDS = {
  sources: {
    github: "a0000000-0000-0000-0000-000000000001",
    arxiv: "a0000000-0000-0000-0000-000000000002",
    huggingface: "a0000000-0000-0000-0000-000000000003",
  },
  pipelineRuns: {
    completed: "b0000000-0000-0000-0000-000000000001",
    failed: "b0000000-0000-0000-0000-000000000002",
    running: "b0000000-0000-0000-0000-000000000003",
  },
  digests: {
    day1: "c0000000-0000-0000-0000-000000000001",
    day2: "c0000000-0000-0000-0000-000000000002",
    day3: "c0000000-0000-0000-0000-000000000003",
  },
  episodes: {
    ready: "d0000000-0000-0000-0000-000000000001",
    pending: "d0000000-0000-0000-0000-000000000002",
  },
  transcripts: {
    ep1: "e0000000-0000-0000-0000-000000000001",
  },
  subscribers: {
    s1: "f0000000-0000-0000-0000-000000000001",
    s2: "f0000000-0000-0000-0000-000000000002",
    s3: "f0000000-0000-0000-0000-000000000003",
    s4: "f0000000-0000-0000-0000-000000000004",
    s5: "f0000000-0000-0000-0000-000000000005",
  },
} as const;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(6, 0, 0, 0);
  return d;
}

function dateStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0] as string;
}

async function seed() {
  console.log("Seeding AI Digest database...");

  // 1. Additional sources (keep existing RSS + HN, add 3 more)
  console.log("  Seeding sources...");
  await db
    .insert(sources)
    .values([
      {
        id: SEED_IDS.sources.github,
        type: "github",
        name: "GitHub Trending AI Repos",
        config: { github: { query: "topic:artificial-intelligence", minStars: 100, createdAfterDays: 7 } },
        enabled: true,
      },
      {
        id: SEED_IDS.sources.arxiv,
        type: "arxiv",
        name: "ArXiv CS.AI Papers",
        config: { arxiv: { categories: ["cs.AI", "cs.LG", "cs.CL"], maxResults: 20 } },
        enabled: true,
      },
      {
        id: SEED_IDS.sources.huggingface,
        type: "huggingface",
        name: "HuggingFace New Models",
        config: { huggingface: { tasks: ["text-generation", "image-classification"], minDownloads: 1000 } },
        enabled: true,
      },
    ])
    .onConflictDoNothing();

  // 2. Pipeline runs
  console.log("  Seeding pipeline runs...");
  await db
    .insert(pipelineRuns)
    .values([
      {
        id: SEED_IDS.pipelineRuns.completed,
        status: "completed",
        triggerType: "scheduled",
        startedAt: daysAgo(1),
        completedAt: new Date(daysAgo(1).getTime() + 18 * 60 * 1000),
        itemsIngested: 47,
        itemsScored: 47,
        itemsDeduped: 38,
        costUsd: 2.34,
      },
      {
        id: SEED_IDS.pipelineRuns.failed,
        status: "failed",
        triggerType: "manual",
        startedAt: daysAgo(2),
        completedAt: new Date(daysAgo(2).getTime() + 5 * 60 * 1000),
        itemsIngested: 32,
        itemsScored: 0,
        itemsDeduped: 0,
        costUsd: 0.12,
        errorDetails: { stage: "categorize", message: "Claude API rate limit exceeded", code: "rate_limit_error" },
      },
      {
        id: SEED_IDS.pipelineRuns.running,
        status: "completed",
        triggerType: "scheduled",
        startedAt: daysAgo(0),
        completedAt: new Date(daysAgo(0).getTime() + 22 * 60 * 1000),
        itemsIngested: 53,
        itemsScored: 53,
        itemsDeduped: 41,
        costUsd: 3.18,
      },
    ])
    .onConflictDoNothing();

  // 3. Pipeline stages (7 stages per run)
  console.log("  Seeding pipeline stages...");
  const stageNames = ["ingest", "normalize", "categorize", "score", "dedup", "synthesize", "output"];

  for (const runId of [SEED_IDS.pipelineRuns.completed, SEED_IDS.pipelineRuns.running]) {
    for (let i = 0; i < stageNames.length; i++) {
      const start = new Date(daysAgo(runId === SEED_IDS.pipelineRuns.completed ? 1 : 0).getTime() + i * 2 * 60 * 1000);
      await db
        .insert(pipelineStages)
        .values({
          pipelineRunId: runId,
          stageName: stageNames[i] as string,
          status: "completed",
          startedAt: start,
          completedAt: new Date(start.getTime() + 90 * 1000),
          itemsProcessed: runId === SEED_IDS.pipelineRuns.completed ? 47 : 53,
        })
        .onConflictDoNothing();
    }
  }

  // Failed run stages
  for (let i = 0; i < stageNames.length; i++) {
    const start = new Date(daysAgo(2).getTime() + i * 2 * 60 * 1000);
    const isFailed = i === 2; // categorize stage failed
    await db
      .insert(pipelineStages)
      .values({
        pipelineRunId: SEED_IDS.pipelineRuns.failed,
        stageName: stageNames[i] as string,
        status: i < 2 ? "completed" : isFailed ? "failed" : "skipped",
        startedAt: i <= 2 ? start : null,
        completedAt: i < 2 ? new Date(start.getTime() + 60 * 1000) : null,
        itemsProcessed: i < 2 ? 32 : 0,
        errorDetails: isFailed ? { message: "Rate limit exceeded" } : null,
      })
      .onConflictDoNothing();
  }

  // 4. Seeded normalized items with scores
  console.log("  Seeding normalized items...");
  const seedItems = [
    { id: "seed-item-001", source: "rss", sourceId: "rss-001", sourceUrl: "https://openai.com/blog/gpt-5", title: "GPT-5 Released: Multimodal Reasoning at Scale", summary: "OpenAI announces GPT-5 with breakthrough multimodal reasoning capabilities, achieving human-level performance on graduate-level math and science benchmarks.", authors: ["OpenAI Research"], categories: ["Large Language Models", "AI Research"], relevanceScore: 0.95, noveltyScore: 0.92, impactScore: 0.98, compositeScore: 0.95 },
    { id: "seed-item-002", source: "github", sourceId: "gh-001", sourceUrl: "https://github.com/anthropic/claude-agent-sdk", title: "Claude Agent SDK: Build AI Agents with Tool Use", summary: "Anthropic releases the Claude Agent SDK enabling developers to build autonomous agents with structured tool use, memory, and multi-step reasoning.", authors: ["Anthropic"], categories: ["Developer Tools", "AI Agents"], relevanceScore: 0.93, noveltyScore: 0.88, impactScore: 0.91, compositeScore: 0.91 },
    { id: "seed-item-003", source: "arxiv", sourceId: "arxiv-001", sourceUrl: "https://arxiv.org/abs/2501.00001", title: "Scaling Laws for Neural Machine Translation Beyond 1T Parameters", summary: "New research demonstrates continued performance gains from scaling transformer models beyond 1 trillion parameters for machine translation tasks.", authors: ["DeepMind Research", "Google Brain"], categories: ["AI Research", "NLP"], relevanceScore: 0.87, noveltyScore: 0.82, impactScore: 0.79, compositeScore: 0.83 },
    { id: "seed-item-004", source: "hackernews", sourceId: "hn-001", sourceUrl: "https://news.ycombinator.com/item?id=99001", title: "Show HN: Open-source voice cloning with 3 seconds of audio", summary: "A new open-source project achieves high-fidelity voice cloning from just 3 seconds of reference audio, using a novel diffusion-based approach.", authors: ["voicecraft-dev"], categories: ["Audio AI", "Open Source"], relevanceScore: 0.89, noveltyScore: 0.94, impactScore: 0.85, compositeScore: 0.89 },
    { id: "seed-item-005", source: "huggingface", sourceId: "hf-001", sourceUrl: "https://huggingface.co/meta-llama/Llama-4-70B", title: "Meta Releases Llama 4 70B with Improved Coding Capabilities", summary: "Meta's latest open-weight model demonstrates significant improvements in code generation, mathematical reasoning, and multilingual understanding.", authors: ["Meta AI"], categories: ["Large Language Models", "Open Source"], relevanceScore: 0.91, noveltyScore: 0.86, impactScore: 0.93, compositeScore: 0.90 },
    { id: "seed-item-006", source: "rss", sourceId: "rss-002", sourceUrl: "https://blog.google/technology/ai/gemini-ultra-2", title: "Google Launches Gemini Ultra 2 with 2M Context Window", summary: "Google DeepMind unveils Gemini Ultra 2 featuring a 2 million token context window, native multimodal understanding, and enhanced reasoning.", authors: ["Google DeepMind"], categories: ["Large Language Models", "AI Research"], relevanceScore: 0.94, noveltyScore: 0.90, impactScore: 0.96, compositeScore: 0.93 },
    { id: "seed-item-007", source: "reddit", sourceId: "reddit-001", sourceUrl: "https://reddit.com/r/MachineLearning/comments/abc123", title: "Discussion: Why retrieval-augmented generation still beats long context", summary: "Community discussion exploring the tradeoffs between RAG and long-context models for production systems, with benchmarks and real-world examples.", authors: ["ml_researcher_42"], categories: ["NLP", "AI Engineering"], relevanceScore: 0.78, noveltyScore: 0.65, impactScore: 0.72, compositeScore: 0.72 },
    { id: "seed-item-008", source: "github", sourceId: "gh-002", sourceUrl: "https://github.com/vercel/ai-sdk", title: "Vercel AI SDK 4.0: Unified Interface for 20+ LLM Providers", summary: "Major release of the Vercel AI SDK with support for streaming structured objects, multi-modal inputs, and a unified provider interface.", authors: ["Vercel"], categories: ["Developer Tools", "AI Infrastructure"], relevanceScore: 0.86, noveltyScore: 0.80, impactScore: 0.84, compositeScore: 0.83 },
    { id: "seed-item-009", source: "arxiv", sourceId: "arxiv-002", sourceUrl: "https://arxiv.org/abs/2501.00002", title: "Constitutional AI: Training Helpful, Harmless, and Honest Systems", summary: "New techniques for aligning language models through constitutional AI methods, showing 40% reduction in harmful outputs while maintaining helpfulness.", authors: ["Anthropic Safety"], categories: ["AI Safety", "AI Research"], relevanceScore: 0.88, noveltyScore: 0.76, impactScore: 0.90, compositeScore: 0.85 },
    { id: "seed-item-010", source: "producthunt", sourceId: "ph-001", sourceUrl: "https://producthunt.com/posts/cursor-ai-2", title: "Cursor AI 2.0: The AI-First Code Editor Goes Multi-Agent", summary: "Cursor AI launches version 2.0 with multi-agent pair programming, background task execution, and codebase-aware completions.", authors: ["Cursor Team"], categories: ["Developer Tools", "AI Productivity"], relevanceScore: 0.90, noveltyScore: 0.85, impactScore: 0.88, compositeScore: 0.88 },
    { id: "seed-item-011", source: "hackernews", sourceId: "hn-002", sourceUrl: "https://news.ycombinator.com/item?id=99002", title: "Apple Intelligence expands to 12 new languages in iOS 18.4", summary: "Apple extends on-device AI features to more languages, including Japanese, Korean, and German, using new efficient multilingual models.", authors: ["apple-watcher"], categories: ["Mobile AI", "Product Launches"], relevanceScore: 0.82, noveltyScore: 0.70, impactScore: 0.80, compositeScore: 0.77 },
    { id: "seed-item-012", source: "rss", sourceId: "rss-003", sourceUrl: "https://mistral.ai/news/pixtral-large", title: "Mistral Launches Pixtral Large: Vision-Language Model for Enterprise", summary: "Mistral AI releases Pixtral Large, a 124B parameter vision-language model optimized for document understanding and visual reasoning tasks.", authors: ["Mistral AI"], categories: ["Large Language Models", "Computer Vision"], relevanceScore: 0.85, noveltyScore: 0.83, impactScore: 0.81, compositeScore: 0.83 },
  ];

  for (const item of seedItems) {
    await db
      .insert(normalizedItems)
      .values({
        ...item,
        publishedAt: daysAgo(Math.floor(Math.random() * 3)),
        pipelineRunId: SEED_IDS.pipelineRuns.completed,
        metadata: {},
      })
      .onConflictDoNothing();
  }

  // 5. Digests
  console.log("  Seeding digests...");
  const syntheses = [
    "Today's AI landscape was dominated by two major announcements. OpenAI released GPT-5 with breakthrough multimodal reasoning, while Google countered with Gemini Ultra 2 featuring a 2M token context window. Both models represent significant leaps in capability, particularly in mathematical reasoning and code generation. Meanwhile, the open-source community continued to thrive with Meta's Llama 4 and a remarkable voice cloning project that achieves high-fidelity results from just 3 seconds of audio. The developer tools space saw major updates from both Vercel (AI SDK 4.0) and Cursor (multi-agent coding). In research, Anthropic published new work on constitutional AI alignment methods.",
    "The AI research community delivered several impactful papers this week. A new study on scaling laws for neural machine translation shows continued gains beyond 1 trillion parameters, challenging earlier assumptions about diminishing returns. Anthropic's constitutional AI paper demonstrates a 40% reduction in harmful outputs while maintaining model helpfulness. On the product side, Cursor AI 2.0 introduces multi-agent pair programming — a paradigm shift in how developers interact with AI coding assistants. Apple expanded Apple Intelligence to 12 new languages, bringing on-device AI to millions more users worldwide.",
    "Open source continues to reshape the AI landscape. Meta's Llama 4 70B pushes the boundaries of what's possible with openly available models, while Mistral's Pixtral Large targets enterprise document understanding. The community on Reddit engaged in a nuanced discussion about RAG vs long-context approaches, with practitioners sharing real-world benchmarks. GitHub trending saw Anthropic's Claude Agent SDK gaining rapid adoption for building autonomous AI agents. The tooling ecosystem matured with Vercel's unified AI SDK supporting 20+ providers through a single interface.",
  ];

  for (let i = 0; i < 3; i++) {
    const digestId = [SEED_IDS.digests.day1, SEED_IDS.digests.day2, SEED_IDS.digests.day3][i] as string;
    await db
      .insert(digests)
      .values({
        id: digestId,
        digestDate: dateStr(i),
        synthesis: syntheses[i] as string,
        synthesisStyle: "editorial",
        itemCount: 4,
        metadata: {
          topTopics: ["Large Language Models", "Developer Tools", "AI Research"],
          sourceBreakdown: { rss: 2, github: 1, arxiv: 1, hackernews: 1, huggingface: 0, reddit: 0, producthunt: 0 } as Record<string, number>,
          dateRange: { start: dateStr(i + 1), end: dateStr(i) },
        },
        pipelineRunId: i === 0 ? SEED_IDS.pipelineRuns.running : SEED_IDS.pipelineRuns.completed,
      })
      .onConflictDoNothing();
  }

  // 6. Digest items (link items to digests)
  console.log("  Seeding digest items...");
  const itemsPerDigest = [
    { digestId: SEED_IDS.digests.day1, itemIds: ["seed-item-001", "seed-item-002", "seed-item-006", "seed-item-010"] },
    { digestId: SEED_IDS.digests.day2, itemIds: ["seed-item-003", "seed-item-004", "seed-item-009", "seed-item-011"] },
    { digestId: SEED_IDS.digests.day3, itemIds: ["seed-item-005", "seed-item-007", "seed-item-008", "seed-item-012"] },
  ];

  const sections = ["Large Language Models", "Developer Tools", "AI Research", "Product Launches"];
  for (const { digestId, itemIds } of itemsPerDigest) {
    for (let rank = 0; rank < itemIds.length; rank++) {
      await db
        .insert(digestItems)
        .values({
          digestId,
          normalizedItemId: itemIds[rank] as string,
          rank: rank + 1,
          section: sections[rank] as string,
        })
        .onConflictDoNothing();
    }
  }

  // 7. Episodes
  console.log("  Seeding episodes...");
  await db
    .insert(episodes)
    .values([
      {
        id: SEED_IDS.episodes.ready,
        digestId: SEED_IDS.digests.day1,
        title: "AI Digest Daily — GPT-5, Gemini Ultra 2, and the Open Source Revolution",
        audioUrl: "/placeholder-episode.mp3",
        durationSeconds: 847,
        audioFormat: "mp3_44100_128",
        voiceConfig: {
          speakers: [
            { role: "Host A", voiceId: "EXAVITQu4vr4xnSDxMaL", settings: { stability: 0.5, similarityBoost: 0.75, speed: 1.0, style: 0.3 } },
            { role: "Host B", voiceId: "onwK4e9ZLuTAKqWW03F9", settings: { stability: 0.5, similarityBoost: 0.75, speed: 1.0, style: 0.3 } },
          ],
          audioFormat: "mp3_44100_128",
          targetDurationMinutes: 15,
        },
        status: "ready",
      },
      {
        id: SEED_IDS.episodes.pending,
        digestId: SEED_IDS.digests.day2,
        title: "AI Digest Daily — Scaling Laws, Constitutional AI, and Cursor 2.0",
        durationSeconds: null,
        status: "pending",
      },
    ])
    .onConflictDoNothing();

  // 8. Transcript for ready episode
  console.log("  Seeding transcript...");
  await db
    .insert(transcripts)
    .values({
      id: SEED_IDS.transcripts.ep1,
      episodeId: SEED_IDS.episodes.ready,
      segments: [
        { speaker: "Host A", text: "Welcome back to AI Digest Daily! I'm Alex, and today we have some absolutely massive announcements to cover.", startTime: 0, endTime: 8 },
        { speaker: "Host B", text: "That's right, Sam. GPT-5 just dropped, and honestly, the benchmarks are kind of mind-blowing.", startTime: 8, endTime: 15 },
        { speaker: "Host A", text: "Let's start there. OpenAI is claiming human-level performance on graduate-level math and science. That's a huge leap from GPT-4.", startTime: 15, endTime: 24 },
        { speaker: "Host B", text: "And it's multimodal from the ground up this time. Not bolted on — native image, audio, and video understanding.", startTime: 24, endTime: 32 },
        { speaker: "Host A", text: "But Google wasn't about to let OpenAI steal the spotlight. Gemini Ultra 2 came out with a 2 million token context window.", startTime: 32, endTime: 41 },
        { speaker: "Host B", text: "Two million tokens! That's like feeding it an entire codebase. The implications for code understanding are massive.", startTime: 41, endTime: 50 },
        { speaker: "Host A", text: "Speaking of code, let's talk about the developer tools space. Cursor AI 2.0 just launched with multi-agent pair programming.", startTime: 50, endTime: 60 },
        { speaker: "Host B", text: "This is the future of coding, honestly. Multiple AI agents working on different parts of your codebase simultaneously.", startTime: 60, endTime: 69 },
        { speaker: "Host A", text: "And Vercel shipped AI SDK 4.0 with support for over 20 LLM providers through a single unified interface.", startTime: 69, endTime: 78 },
        { speaker: "Host B", text: "The open source side is equally exciting. Meta dropped Llama 4, and the coding benchmarks are genuinely competitive with proprietary models.", startTime: 78, endTime: 89 },
        { speaker: "Host A", text: "Plus that voice cloning project on Hacker News — 3 seconds of audio and you get high-fidelity cloning. The diffusion approach is clever.", startTime: 89, endTime: 100 },
        { speaker: "Host B", text: "We should also mention Anthropic's constitutional AI paper. A 40% reduction in harmful outputs while keeping helpfulness intact.", startTime: 100, endTime: 111 },
        { speaker: "Host A", text: "That's a wrap for today's AI Digest Daily. Thanks for listening, and we'll see you tomorrow!", startTime: 111, endTime: 119 },
        { speaker: "Host B", text: "Don't forget to subscribe to the newsletter for the full written digest. Until next time!", startTime: 119, endTime: 126 },
      ],
      fullText: "Welcome back to AI Digest Daily! I'm Alex, and today we have some absolutely massive announcements to cover. That's right, Sam. GPT-5 just dropped, and honestly, the benchmarks are kind of mind-blowing. Let's start there. OpenAI is claiming human-level performance on graduate-level math and science. That's a huge leap from GPT-4. And it's multimodal from the ground up this time. Not bolted on — native image, audio, and video understanding. But Google wasn't about to let OpenAI steal the spotlight. Gemini Ultra 2 came out with a 2 million token context window. Two million tokens! That's like feeding it an entire codebase. The implications for code understanding are massive. Speaking of code, let's talk about the developer tools space. Cursor AI 2.0 just launched with multi-agent pair programming. This is the future of coding, honestly. Multiple AI agents working on different parts of your codebase simultaneously. And Vercel shipped AI SDK 4.0 with support for over 20 LLM providers through a single unified interface. The open source side is equally exciting. Meta dropped Llama 4, and the coding benchmarks are genuinely competitive with proprietary models. Plus that voice cloning project on Hacker News — 3 seconds of audio and you get high-fidelity cloning. The diffusion approach is clever. We should also mention Anthropic's constitutional AI paper. A 40% reduction in harmful outputs while keeping helpfulness intact. That's a wrap for today's AI Digest Daily. Thanks for listening, and we'll see you tomorrow! Don't forget to subscribe to the newsletter for the full written digest. Until next time!",
    })
    .onConflictDoNothing();

  // 9. Subscribers
  console.log("  Seeding subscribers...");
  await db
    .insert(subscribers)
    .values([
      { id: SEED_IDS.subscribers.s1, email: "alice@example.com", status: "active" },
      { id: SEED_IDS.subscribers.s2, email: "bob@techcorp.io", status: "active" },
      { id: SEED_IDS.subscribers.s3, email: "charlie@startup.dev", status: "active" },
      { id: SEED_IDS.subscribers.s4, email: "dana@university.edu", status: "unsubscribed", unsubscribedAt: daysAgo(5) },
      { id: SEED_IDS.subscribers.s5, email: "eve@researcher.org", status: "active" },
    ])
    .onConflictDoNothing();

  // 10. Config entries
  console.log("  Seeding config...");
  await db
    .insert(config)
    .values([
      {
        key: "digest",
        value: {
          topics: [
            { name: "Large Language Models", keywords: ["LLM", "GPT", "Claude", "Gemini", "Llama"], weight: 1.0 },
            { name: "AI Research", keywords: ["paper", "arxiv", "research", "benchmark"], weight: 0.9 },
            { name: "Developer Tools", keywords: ["SDK", "API", "framework", "library", "tool"], weight: 0.85 },
            { name: "AI Safety", keywords: ["alignment", "safety", "constitutional", "RLHF"], weight: 0.8 },
            { name: "Computer Vision", keywords: ["image", "vision", "visual", "multimodal"], weight: 0.75 },
            { name: "Open Source", keywords: ["open-source", "github", "huggingface", "community"], weight: 0.7 },
          ],
          scoring: { noveltyWeight: 0.3, impactWeight: 0.4, relevanceWeight: 0.3, minScore: 0.5 },
          synthesis: { maxItems: 15, style: "editorial" },
        },
      },
      {
        key: "pipeline",
        value: {
          maxBudgetUsd: 5.0,
          schedule: "0 6 * * *",
          enablePodcast: true,
          enableNewsletter: true,
        },
      },
      {
        key: "podcast",
        value: {
          speakers: [
            { role: "Host A", voiceId: "EXAVITQu4vr4xnSDxMaL", settings: { stability: 0.5, similarityBoost: 0.75, speed: 1.0, style: 0.3 } },
            { role: "Host B", voiceId: "onwK4e9ZLuTAKqWW03F9", settings: { stability: 0.5, similarityBoost: 0.75, speed: 1.0, style: 0.3 } },
          ],
          audioFormat: "mp3_44100_128",
          targetDurationMinutes: 15,
        },
      },
      {
        key: "schedule",
        value: {
          cron: "0 6 * * *",
          timezone: "America/New_York",
          nextRun: new Date(daysAgo(-1)).toISOString(),
        },
      },
    ])
    .onConflictDoNothing();

  console.log("Seeding complete!");

  // Print summary
  const counts = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(sources),
    db.select({ count: sql<number>`count(*)` }).from(normalizedItems),
    db.select({ count: sql<number>`count(*)` }).from(digests),
    db.select({ count: sql<number>`count(*)` }).from(digestItems),
    db.select({ count: sql<number>`count(*)` }).from(episodes),
    db.select({ count: sql<number>`count(*)` }).from(transcripts),
    db.select({ count: sql<number>`count(*)` }).from(subscribers),
    db.select({ count: sql<number>`count(*)` }).from(pipelineRuns),
    db.select({ count: sql<number>`count(*)` }).from(pipelineStages),
    db.select({ count: sql<number>`count(*)` }).from(config),
  ]);

  const tableNames = ["sources", "normalized_items", "digests", "digest_items", "episodes", "transcripts", "subscribers", "pipeline_runs", "pipeline_stages", "config"];
  console.log("\nTable row counts:");
  for (let i = 0; i < tableNames.length; i++) {
    console.log(`  ${tableNames[i]}: ${counts[i]?.[0]?.count ?? 0}`);
  }

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
