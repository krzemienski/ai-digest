import Anthropic from "@anthropic-ai/sdk";
import type { DiscoveryCandidate } from "@ai-digest/shared";
import { probeRssFeeds, validateSourceUrl } from "./validators";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface DiscoveryAgentConfig {
  readonly topics: string[];
  readonly sourceTypes: string[];
  readonly maxSources: number;
  readonly apiKey: string;
  readonly onProgress?: (message: string) => void;
}

export interface DiscoveryResult {
  readonly candidates: readonly DiscoveryCandidate[];
  readonly totalSearched: number;
  readonly durationMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 20;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MODEL = "claude-haiku-4-5-20251001";

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const DISCOVERY_TOOLS: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the web for content sources, blogs, and feeds related to a query. Returns URLs and descriptions of potential sources. Use specific queries like 'robotics RSS feeds', 'AI research blogs atom feed', 'machine learning newsletter feeds'.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Web search query (e.g., 'robotics RSS feeds', 'AI research blogs atom feed')",
        },
        max_results: {
          type: "number",
          description: "Max results to return (default 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_rss_feeds",
    description:
      "Search for RSS feeds at a specific domain or URL pattern. Tries common feed paths (/feed, /rss, /atom.xml, /feed.xml, /rss.xml, /blog/feed, /index.xml). Returns found feeds with their titles.",
    input_schema: {
      type: "object" as const,
      properties: {
        domain: {
          type: "string",
          description:
            "Domain to probe for RSS feeds (e.g., 'openai.com', 'blog.google')",
        },
        topic: {
          type: "string",
          description: "Topic context for result ranking",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "validate_source",
    description:
      "Test if a source URL is reachable and recently updated. Fetches the URL, checks HTTP status, tries to parse as RSS/Atom, and returns validation info (reachable, content_type, last_updated, item_count).",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL to validate" },
        type: {
          type: "string",
          enum: ["rss", "reddit", "github", "arxiv", "hackernews", "huggingface", "producthunt"],
          description: "Source type for validation context",
        },
      },
      required: ["url", "type"],
    },
  },
  {
    name: "submit_candidate",
    description:
      "Submit a validated source as a discovery candidate. Only submit sources you have already validated. Include a relevance score from 0-100 based on how well the source matches the requested topics.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Human-readable source name" },
        type: {
          type: "string",
          enum: [
            "rss",
            "reddit",
            "github",
            "arxiv",
            "hackernews",
            "huggingface",
            "producthunt",
          ],
          description: "Source type",
        },
        url: { type: "string", description: "Source URL" },
        description: {
          type: "string",
          description: "Brief description of the source and its content",
        },
        relevanceScore: {
          type: "number",
          description: "Relevance score from 0-100 based on topic match",
        },
        config: {
          type: "object",
          description:
            "Source configuration (e.g., { feedUrl: '...' } for RSS, { subreddit: '...' } for Reddit)",
        },
      },
      required: ["name", "type", "url", "description", "relevanceScore", "config"],
    },
  },
];

// ---------------------------------------------------------------------------
// Known source patterns for web_search simulation
// ---------------------------------------------------------------------------

interface KnownSource {
  readonly name: string;
  readonly url: string;
  readonly feedUrl: string;
  readonly description: string;
  readonly type: string;
  readonly topics: readonly string[];
}

const KNOWN_AI_SOURCES: readonly KnownSource[] = [
  { name: "OpenAI Blog", url: "https://openai.com/blog", feedUrl: "https://openai.com/blog/rss.xml", description: "Official OpenAI research and product announcements", type: "rss", topics: ["ai", "machine learning", "gpt", "language models", "openai"] },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/", feedUrl: "https://blog.google/technology/ai/rss/", description: "Google's AI research and product updates", type: "rss", topics: ["ai", "machine learning", "google", "deep learning"] },
  { name: "DeepMind Blog", url: "https://deepmind.google/discover/blog/", feedUrl: "https://deepmind.google/discover/blog/rss.xml", description: "DeepMind research publications and breakthroughs", type: "rss", topics: ["ai", "reinforcement learning", "deep learning", "deepmind"] },
  { name: "Meta AI Blog", url: "https://ai.meta.com/blog/", feedUrl: "https://ai.meta.com/blog/rss/", description: "Meta's AI research including LLaMA and open-source AI", type: "rss", topics: ["ai", "open source", "llama", "meta"] },
  { name: "Anthropic Research", url: "https://www.anthropic.com/research", feedUrl: "https://www.anthropic.com/rss.xml", description: "Anthropic's AI safety and Claude research", type: "rss", topics: ["ai safety", "language models", "anthropic", "claude"] },
  { name: "MIT Technology Review - AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/", feedUrl: "https://www.technologyreview.com/topic/artificial-intelligence/feed", description: "MIT Tech Review's AI coverage", type: "rss", topics: ["ai", "technology", "research", "policy"] },
  { name: "The Batch by Andrew Ng", url: "https://www.deeplearning.ai/the-batch/", feedUrl: "https://www.deeplearning.ai/the-batch/feed/", description: "Andrew Ng's weekly AI newsletter", type: "rss", topics: ["ai", "machine learning", "deep learning", "education"] },
  { name: "Towards Data Science", url: "https://towardsdatascience.com", feedUrl: "https://towardsdatascience.com/feed", description: "Medium publication for data science and ML tutorials", type: "rss", topics: ["data science", "machine learning", "tutorials", "python"] },
  { name: "Machine Learning Mastery", url: "https://machinelearningmastery.com", feedUrl: "https://machinelearningmastery.com/feed/", description: "Practical ML tutorials and guides", type: "rss", topics: ["machine learning", "tutorials", "deep learning", "python"] },
  { name: "Distill.pub", url: "https://distill.pub", feedUrl: "https://distill.pub/rss.xml", description: "Interactive ML research articles with visualizations", type: "rss", topics: ["machine learning", "research", "visualization", "deep learning"] },
  { name: "r/MachineLearning", url: "https://reddit.com/r/MachineLearning", feedUrl: "https://www.reddit.com/r/MachineLearning/.rss", description: "Reddit community for ML research and discussion", type: "reddit", topics: ["machine learning", "research", "deep learning"] },
  { name: "r/artificial", url: "https://reddit.com/r/artificial", feedUrl: "https://www.reddit.com/r/artificial/.rss", description: "Reddit community for AI news and discussion", type: "reddit", topics: ["ai", "artificial intelligence", "news"] },
  { name: "r/LocalLLaMA", url: "https://reddit.com/r/LocalLLaMA", feedUrl: "https://www.reddit.com/r/LocalLLaMA/.rss", description: "Reddit community for local LLM deployment", type: "reddit", topics: ["llm", "open source", "local ai", "language models"] },
  { name: "r/robotics", url: "https://reddit.com/r/robotics", feedUrl: "https://www.reddit.com/r/robotics/.rss", description: "Reddit community for robotics enthusiasts", type: "reddit", topics: ["robotics", "automation", "hardware"] },
  { name: "r/computervision", url: "https://reddit.com/r/computervision", feedUrl: "https://www.reddit.com/r/computervision/.rss", description: "Reddit community for computer vision research", type: "reddit", topics: ["computer vision", "image recognition", "deep learning"] },
  { name: "ArXiv cs.AI", url: "https://arxiv.org/list/cs.AI/recent", feedUrl: "https://rss.arxiv.org/rss/cs.AI", description: "Latest AI research papers on ArXiv", type: "arxiv", topics: ["ai", "research", "papers"] },
  { name: "ArXiv cs.LG", url: "https://arxiv.org/list/cs.LG/recent", feedUrl: "https://rss.arxiv.org/rss/cs.LG", description: "Latest machine learning papers on ArXiv", type: "arxiv", topics: ["machine learning", "research", "papers"] },
  { name: "ArXiv cs.CL", url: "https://arxiv.org/list/cs.CL/recent", feedUrl: "https://rss.arxiv.org/rss/cs.CL", description: "Latest NLP and computational linguistics papers", type: "arxiv", topics: ["nlp", "language models", "research", "papers"] },
  { name: "ArXiv cs.CV", url: "https://arxiv.org/list/cs.CV/recent", feedUrl: "https://rss.arxiv.org/rss/cs.CV", description: "Latest computer vision papers on ArXiv", type: "arxiv", topics: ["computer vision", "deep learning", "research", "papers"] },
  { name: "ArXiv cs.RO", url: "https://arxiv.org/list/cs.RO/recent", feedUrl: "https://rss.arxiv.org/rss/cs.RO", description: "Latest robotics papers on ArXiv", type: "arxiv", topics: ["robotics", "research", "papers", "automation"] },
  { name: "Hacker News", url: "https://news.ycombinator.com", feedUrl: "https://hnrss.org/frontpage", description: "Y Combinator's Hacker News front page", type: "hackernews", topics: ["technology", "startups", "programming", "ai"] },
  { name: "HuggingFace Daily Papers", url: "https://huggingface.co/papers", feedUrl: "https://huggingface.co/papers/rss", description: "Trending ML papers curated by the HuggingFace community", type: "huggingface", topics: ["machine learning", "research", "models", "papers"] },
  { name: "Lil'Log (Lilian Weng)", url: "https://lilianweng.github.io", feedUrl: "https://lilianweng.github.io/index.xml", description: "In-depth ML research summaries by OpenAI researcher Lilian Weng", type: "rss", topics: ["machine learning", "research", "deep learning", "tutorials"] },
  { name: "Jay Alammar's Blog", url: "https://jalammar.github.io", feedUrl: "https://jalammar.github.io/feed.xml", description: "Visual explanations of ML concepts", type: "rss", topics: ["machine learning", "visualization", "transformers", "tutorials"] },
  { name: "Sebastian Raschka's Blog", url: "https://sebastianraschka.com/blog/", feedUrl: "https://sebastianraschka.com/rss_feed.xml", description: "ML research insights and practical guides", type: "rss", topics: ["machine learning", "research", "llm", "tutorials"] },
  { name: "The Gradient", url: "https://thegradient.pub", feedUrl: "https://thegradient.pub/rss/", description: "Perspectives on AI research for the research community", type: "rss", topics: ["ai", "research", "policy", "machine learning"] },
  { name: "Import AI Newsletter", url: "https://importai.substack.com", feedUrl: "https://importai.substack.com/feed", description: "Weekly AI newsletter by Jack Clark (Anthropic co-founder)", type: "rss", topics: ["ai", "policy", "research", "industry"] },
  { name: "AI Alignment Forum", url: "https://www.alignmentforum.org", feedUrl: "https://www.alignmentforum.org/feed.xml", description: "Discussion forum for AI alignment research", type: "rss", topics: ["ai safety", "alignment", "research"] },
  { name: "Papers With Code", url: "https://paperswithcode.com", feedUrl: "https://paperswithcode.com/rss", description: "ML papers with code implementations and benchmarks", type: "rss", topics: ["machine learning", "research", "papers", "code"] },
  { name: "NVIDIA AI Blog", url: "https://blogs.nvidia.com/blog/category/deep-learning/", feedUrl: "https://blogs.nvidia.com/blog/category/deep-learning/feed/", description: "NVIDIA's deep learning and GPU computing updates", type: "rss", topics: ["deep learning", "gpu", "hardware", "nvidia"] },
  { name: "r/StableDiffusion", url: "https://reddit.com/r/StableDiffusion", feedUrl: "https://www.reddit.com/r/StableDiffusion/.rss", description: "Reddit community for Stable Diffusion and image generation AI", type: "reddit", topics: ["stable diffusion", "image generation", "generative ai"] },
  { name: "r/AutonomousVehicles", url: "https://reddit.com/r/SelfDrivingCars", feedUrl: "https://www.reddit.com/r/SelfDrivingCars/.rss", description: "Reddit community for autonomous vehicle technology", type: "reddit", topics: ["autonomous vehicles", "self-driving", "robotics"] },
  { name: "GitHub Trending ML", url: "https://github.com/trending?since=daily", feedUrl: "https://github.com/trending", description: "Trending machine learning repositories on GitHub", type: "github", topics: ["open source", "machine learning", "code", "tools"] },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

interface WebSearchInput {
  readonly query: string;
  readonly max_results?: number;
}

interface SearchRssFeedsInput {
  readonly domain: string;
  readonly topic?: string;
}

interface ValidateSourceInput {
  readonly url: string;
  readonly type: string;
}

interface SubmitCandidateInput {
  readonly name: string;
  readonly type: string;
  readonly url: string;
  readonly description: string;
  readonly relevanceScore: number;
  readonly config: Record<string, unknown>;
}

function handleWebSearch(input: WebSearchInput): string {
  const maxResults = input.max_results ?? 10;
  const queryLower = input.query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  // Score each known source by how well its topics match the query
  const scored = KNOWN_AI_SOURCES.map((source) => {
    let score = 0;
    for (const term of queryTerms) {
      for (const topic of source.topics) {
        if (topic.includes(term) || term.includes(topic)) {
          score += 1;
        }
      }
      // Also match against name and description
      if (source.name.toLowerCase().includes(term)) {
        score += 2;
      }
      if (source.description.toLowerCase().includes(term)) {
        score += 1;
      }
    }
    return { source, score };
  });

  const filtered = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  if (filtered.length === 0) {
    return JSON.stringify({
      results: [],
      message: `No known sources matched "${input.query}". Try using search_rss_feeds with specific domains instead.`,
    });
  }

  const results = filtered.map((entry) => ({
    name: entry.source.name,
    url: entry.source.url,
    feedUrl: entry.source.feedUrl,
    description: entry.source.description,
    type: entry.source.type,
  }));

  return JSON.stringify({ results });
}

async function handleSearchRssFeeds(input: SearchRssFeedsInput): Promise<string> {
  try {
    const feeds = await probeRssFeeds(input.domain);

    if (feeds.length === 0) {
      return JSON.stringify({
        feeds: [],
        message: `No RSS/Atom feeds found at ${input.domain}. The site may not offer feeds, or they may be at non-standard paths.`,
      });
    }

    return JSON.stringify({
      feeds: feeds.map((feed) => ({
        url: feed.url,
        title: feed.title,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return JSON.stringify({
      feeds: [],
      error: `Failed to probe ${input.domain}: ${message}`,
    });
  }
}

async function handleValidateSource(input: ValidateSourceInput): Promise<string> {
  try {
    const result = await validateSourceUrl(input.url);
    return JSON.stringify({
      url: input.url,
      type: input.type,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return JSON.stringify({
      url: input.url,
      type: input.type,
      reachable: false,
      contentType: "error",
      lastUpdated: null,
      itemCount: null,
      error: message,
    });
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(config: DiscoveryAgentConfig): string {
  const topicsStr = config.topics.join(", ");
  const typesStr =
    config.sourceTypes.length > 0
      ? config.sourceTypes.join(", ")
      : "rss, reddit, github, arxiv, hackernews, huggingface, producthunt";

  return `You are an AI source discovery agent. Your task is to find high-quality content sources related to specific topics.

## Your Mission
Find up to ${config.maxSources} new content sources about: ${topicsStr}
Acceptable source types: ${typesStr}

## Workflow
1. Use web_search to find potential sources related to the topics
2. For promising domains, use search_rss_feeds to discover feed URLs
3. Use validate_source to confirm each URL is reachable and has fresh content
4. Use submit_candidate to add validated, high-quality sources

## Quality Criteria
- Sources should be actively maintained (updated within the last 30 days if possible)
- Sources should have substantial content (at least 5 items for feeds)
- Sources should be directly relevant to the requested topics
- Prefer authoritative sources (research labs, established publications, popular communities)
- Assign relevance scores honestly: 90-100 for perfect matches, 70-89 for good matches, 50-69 for partial matches

## Source Config Format
- RSS: { "feedUrl": "https://..." }
- Reddit: { "subreddit": "MachineLearning" }
- GitHub: { "query": "machine-learning", "language": "python" }
- ArXiv: { "categories": ["cs.AI"] }
- HackerNews: { "type": "topstories" }
- HuggingFace: { "type": "papers" }
- ProductHunt: { "topic": "artificial-intelligence" }

## Important Rules
- Always validate before submitting
- Do NOT submit duplicate sources
- Be systematic: search broadly first, then dive into specific domains
- Provide clear, accurate descriptions for each source`;
}

// ---------------------------------------------------------------------------
// Agent loop
// ---------------------------------------------------------------------------

async function processToolCall(
  toolName: string,
  toolInput: unknown,
  candidates: DiscoveryCandidate[],
  searchCount: { value: number },
  onProgress?: (message: string) => void,
): Promise<string> {
  switch (toolName) {
    case "web_search": {
      searchCount.value += 1;
      const input = toolInput as WebSearchInput;
      onProgress?.(`Searching: ${input.query}`);
      return handleWebSearch(input);
    }
    case "search_rss_feeds": {
      searchCount.value += 1;
      const input = toolInput as SearchRssFeedsInput;
      onProgress?.(`Probing feeds at: ${input.domain}`);
      return await handleSearchRssFeeds(input);
    }
    case "validate_source": {
      const input = toolInput as ValidateSourceInput;
      onProgress?.(`Validating: ${input.url}`);
      return await handleValidateSource(input);
    }
    case "submit_candidate": {
      const input = toolInput as SubmitCandidateInput;
      const candidate: DiscoveryCandidate = {
        name: input.name,
        type: input.type,
        url: input.url,
        description: input.description,
        relevanceScore: Math.min(100, Math.max(0, Math.round(input.relevanceScore))),
        config: input.config,
        validated: true,
      };

      // Check for duplicate URL
      const isDuplicate = candidates.some(
        (c) => c.url.toLowerCase() === candidate.url.toLowerCase(),
      );
      if (isDuplicate) {
        return JSON.stringify({
          success: false,
          message: `Source "${input.name}" (${input.url}) already submitted. Skipping duplicate.`,
        });
      }

      candidates.push(candidate);
      onProgress?.(
        `Submitted candidate: ${candidate.name} (${candidate.type}, score: ${candidate.relevanceScore})`,
      );
      return JSON.stringify({
        success: true,
        message: `Added "${candidate.name}" as candidate #${candidates.length}.`,
        totalCandidates: candidates.length,
      });
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

export async function runDiscoveryAgent(
  config: DiscoveryAgentConfig,
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  const client = new Anthropic({ apiKey: config.apiKey });
  const candidates: DiscoveryCandidate[] = [];
  const searchCount = { value: 0 };
  const { onProgress } = config;

  onProgress?.("Starting AI source discovery agent...");

  const systemPrompt = buildSystemPrompt(config);

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Please find up to ${config.maxSources} high-quality content sources about: ${config.topics.join(", ")}. Start by searching broadly, then validate and submit your best finds.`,
    },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= TIMEOUT_MS) {
      onProgress?.("Discovery timed out after 5 minutes. Returning partial results.");
      break;
    }

    // Check if we've hit the max candidates
    if (candidates.length >= config.maxSources) {
      onProgress?.(
        `Reached target of ${config.maxSources} candidates. Finishing.`,
      );
      break;
    }

    try {
      // Use auto tool_choice for first iterations, then allow the model to stop naturally
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        tools: DISCOVERY_TOOLS,
        tool_choice: { type: "auto" },
        messages,
      });

      // Check for end_turn (model decided it's done)
      if (response.stop_reason === "end_turn") {
        onProgress?.("Agent completed discovery process.");
        break;
      }

      // Process tool use blocks
      if (response.stop_reason === "tool_use") {
        // Add assistant message to history
        messages.push({ role: "assistant", content: response.content });

        // Process each tool use block and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type === "tool_use") {
            const result = await processToolCall(
              block.name,
              block.input,
              candidates,
              searchCount,
              onProgress,
            );
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        // Add tool results to messages
        messages.push({ role: "user", content: toolResults });
      } else {
        // Model returned text without tool use -- treat as done
        onProgress?.("Agent completed with final message.");
        break;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      onProgress?.(`Agent error: ${message}`);

      // If it's a rate limit or transient error, wait briefly and retry
      if (
        message.includes("rate") ||
        message.includes("overloaded") ||
        message.includes("529")
      ) {
        onProgress?.("Rate limited. Waiting 5 seconds before retry...");
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        continue;
      }

      // For other errors, stop the loop
      break;
    }
  }

  const durationMs = Date.now() - startTime;
  onProgress?.(
    `Discovery complete: ${candidates.length} candidates found, ${searchCount.value} searches performed in ${Math.round(durationMs / 1000)}s`,
  );

  return {
    candidates,
    totalSearched: searchCount.value,
    durationMs,
  };
}
