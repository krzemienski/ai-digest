import type { SourceConfig } from "./types";

export interface SeedSource {
  name: string;
  type: "rss" | "github" | "arxiv" | "hackernews" | "huggingface" | "reddit" | "producthunt";
  config: SourceConfig;
  enabled: boolean;
}

export const SEED_SOURCES: SeedSource[] = [
  // RSS - AI Labs
  {
    name: "OpenAI Blog",
    type: "rss",
    config: { rss: { url: "https://openai.com/news/rss.xml" } },
    enabled: true,
  },
  {
    name: "Anthropic Engineering",
    type: "rss",
    config: { rss: { url: "https://raw.githubusercontent.com/conoro/anthropic-engineering-rss-feed/main/anthropic_engineering_rss.xml" } },
    enabled: true,
  },
  {
    name: "Google DeepMind",
    type: "rss",
    config: { rss: { url: "https://deepmind.google/blog/rss.xml" } },
    enabled: true,
  },
  {
    name: "Meta AI Engineering",
    type: "rss",
    config: { rss: { url: "https://engineering.fb.com/feed/" } },
    enabled: true,
  },
  {
    name: "Microsoft Research",
    type: "rss",
    config: { rss: { url: "https://www.microsoft.com/en-us/research/blog/feed/" } },
    enabled: true,
  },

  // RSS - News
  {
    name: "The Verge AI",
    type: "rss",
    config: { rss: { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" } },
    enabled: true,
  },
  {
    name: "Ars Technica AI",
    type: "rss",
    config: { rss: { url: "https://arstechnica.com/ai/feed/" } },
    enabled: true,
  },
  {
    name: "TechCrunch AI",
    type: "rss",
    config: { rss: { url: "https://techcrunch.com/category/artificial-intelligence/feed/" } },
    enabled: true,
  },
  {
    name: "MIT Tech Review AI",
    type: "rss",
    config: { rss: { url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" } },
    enabled: true,
  },
  {
    name: "VentureBeat AI",
    type: "rss",
    config: { rss: { url: "https://venturebeat.com/category/ai/feed/" } },
    enabled: true,
  },

  // RSS - Newsletters
  {
    name: "The Batch (Andrew Ng)",
    type: "rss",
    config: { rss: { url: "https://www.deeplearning.ai/the-batch/feed/" } },
    enabled: true,
  },
  {
    name: "Import AI",
    type: "rss",
    config: { rss: { url: "https://importai.substack.com/feed" } },
    enabled: true,
  },
  {
    name: "Ahead of AI",
    type: "rss",
    config: { rss: { url: "https://magazine.sebastianraschka.com/feed" } },
    enabled: true,
  },
  {
    name: "Last Week in AI",
    type: "rss",
    config: { rss: { url: "https://lastweekin.ai/feed" } },
    enabled: true,
  },

  // ArXiv
  {
    name: "ArXiv AI/ML/NLP/CV",
    type: "arxiv",
    config: { arxiv: { categories: ["cs.AI", "cs.CL", "cs.CV", "cs.LG"] } },
    enabled: true,
  },

  // HuggingFace
  {
    name: "HF Daily Papers",
    type: "huggingface",
    config: { huggingface: {} },
    enabled: true,
  },

  // Hacker News
  {
    name: "HN AI Stories",
    type: "hackernews",
    config: {
      hackernews: {
        keywords: ["artificial intelligence", "machine learning", "LLM", "GPT", "Claude", "deep learning", "neural network"],
        minPoints: 20,
      },
    },
    enabled: true,
  },

  // GitHub
  {
    name: "GitHub AI Releases",
    type: "github",
    config: { github: { query: "topic:machine-learning", minStars: 100, createdAfterDays: 7 } },
    enabled: true,
  },

  // Reddit
  {
    name: "r/MachineLearning",
    type: "reddit",
    config: { reddit: { subreddits: ["MachineLearning"] } },
    enabled: true,
  },
  {
    name: "r/LocalLLaMA",
    type: "reddit",
    config: { reddit: { subreddits: ["LocalLLaMA"] } },
    enabled: true,
  },

  // Product Hunt
  {
    name: "PH AI Products",
    type: "producthunt",
    config: { producthunt: { topic: "artificial-intelligence" } },
    enabled: true,
  },

  // Additional RSS
  {
    name: "Google AI Blog",
    type: "rss",
    config: { rss: { url: "https://blog.google/technology/ai/rss/" } },
    enabled: true,
  },
];
