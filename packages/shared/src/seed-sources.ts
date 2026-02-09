import type { SourceConfig } from "./types";

export interface SeedSource {
  name: string;
  type: "rss" | "github" | "arxiv" | "hackernews" | "huggingface" | "reddit" | "producthunt";
  config: SourceConfig;
  enabled: boolean;
}

export const SEED_SOURCES: SeedSource[] = [
  // ─────────────────────────────────────────────────
  // RSS - AI Labs
  // ─────────────────────────────────────────────────
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
  {
    name: "Google AI Blog",
    type: "rss",
    config: { rss: { url: "https://blog.google/technology/ai/rss/" } },
    enabled: true,
  },
  {
    name: "NVIDIA AI Blog",
    type: "rss",
    config: { rss: { url: "https://blogs.nvidia.com/feed/" } },
    enabled: true,
  },
  {
    name: "Apple Machine Learning Journal",
    type: "rss",
    config: { rss: { url: "https://machinelearning.apple.com/rss.xml" } },
    enabled: true,
  },
  {
    name: "Anthropic Blog",
    type: "rss",
    config: { rss: { url: "https://www.anthropic.com/rss.xml" } },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // RSS - News
  // ─────────────────────────────────────────────────
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
  {
    name: "Wired AI",
    type: "rss",
    config: { rss: { url: "https://www.wired.com/feed/tag/ai/latest/rss" } },
    enabled: true,
  },
  {
    name: "IEEE Spectrum AI",
    type: "rss",
    config: { rss: { url: "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss" } },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // RSS - Newsletters & Blogs
  // ─────────────────────────────────────────────────
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
  {
    name: "BAIR Blog",
    type: "rss",
    config: { rss: { url: "https://bair.berkeley.edu/blog/feed.xml" } },
    enabled: true,
  },
  {
    name: "Stanford HAI",
    type: "rss",
    config: { rss: { url: "https://hai.stanford.edu/news/rss.xml" } },
    enabled: true,
  },
  {
    name: "fast.ai Blog",
    type: "rss",
    config: { rss: { url: "https://www.fast.ai/atom.xml" } },
    enabled: true,
  },
  {
    name: "Hugging Face Blog",
    type: "rss",
    config: { rss: { url: "https://huggingface.co/blog/feed.xml" } },
    enabled: true,
  },
  {
    name: "LangChain Blog",
    type: "rss",
    config: { rss: { url: "https://blog.langchain.dev/rss/" } },
    enabled: true,
  },
  {
    name: "LlamaIndex Blog",
    type: "rss",
    config: { rss: { url: "https://www.llamaindex.ai/blog/rss.xml" } },
    enabled: true,
  },
  {
    name: "Weights & Biases Blog",
    type: "rss",
    config: { rss: { url: "https://wandb.ai/fully-connected/rss.xml" } },
    enabled: true,
  },
  {
    name: "Scale AI Blog",
    type: "rss",
    config: { rss: { url: "https://scale.com/blog/rss.xml" } },
    enabled: true,
  },
  {
    name: "Cohere Blog",
    type: "rss",
    config: { rss: { url: "https://cohere.com/blog/rss.xml" } },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // ArXiv
  // ─────────────────────────────────────────────────
  {
    name: "ArXiv AI/ML/NLP/CV",
    type: "arxiv",
    config: { arxiv: { categories: ["cs.AI", "cs.CL", "cs.CV", "cs.LG"] } },
    enabled: true,
  },
  {
    name: "ArXiv Robotics",
    type: "arxiv",
    config: { arxiv: { categories: ["cs.RO"], maxResults: 30 } },
    enabled: true,
  },
  {
    name: "ArXiv Multi-Agent Systems",
    type: "arxiv",
    config: { arxiv: { categories: ["cs.MA"], maxResults: 30 } },
    enabled: true,
  },
  {
    name: "ArXiv Statistical ML",
    type: "arxiv",
    config: { arxiv: { categories: ["stat.ML"], maxResults: 30 } },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // HuggingFace
  // ─────────────────────────────────────────────────
  {
    name: "HF Daily Papers",
    type: "huggingface",
    config: { huggingface: { tasks: ["daily-papers"] } },
    enabled: true,
  },
  {
    name: "HF Text Generation Models",
    type: "huggingface",
    config: { huggingface: { tasks: ["text-generation"], minDownloads: 1000 } },
    enabled: true,
  },
  {
    name: "HF Image Generation Models",
    type: "huggingface",
    config: { huggingface: { tasks: ["text-to-image"], minDownloads: 500 } },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // Hacker News
  // ─────────────────────────────────────────────────
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
  {
    name: "HN AI Tools & Infra",
    type: "hackernews",
    config: {
      hackernews: {
        keywords: ["transformer", "diffusion model", "RAG", "vector database", "fine-tuning", "RLHF", "inference"],
        minPoints: 15,
      },
    },
    enabled: true,
  },
  {
    name: "HN AI Companies",
    type: "hackernews",
    config: {
      hackernews: {
        keywords: ["OpenAI", "Anthropic", "Google DeepMind", "Meta AI", "Mistral", "Stability AI", "Midjourney"],
        minPoints: 30,
      },
    },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // GitHub
  // ─────────────────────────────────────────────────
  {
    name: "GitHub AI Releases",
    type: "github",
    config: { github: { query: "topic:machine-learning", minStars: 100, createdAfterDays: 7 } },
    enabled: true,
  },
  {
    name: "GitHub Deep Learning",
    type: "github",
    config: { github: { query: "topic:deep-learning", minStars: 50, createdAfterDays: 7 } },
    enabled: true,
  },
  {
    name: "GitHub NLP",
    type: "github",
    config: { github: { query: "topic:natural-language-processing", minStars: 50, createdAfterDays: 7 } },
    enabled: true,
  },
  {
    name: "GitHub Computer Vision",
    type: "github",
    config: { github: { query: "topic:computer-vision", minStars: 50, createdAfterDays: 7 } },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // Reddit
  // ─────────────────────────────────────────────────
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
  {
    name: "r/artificial",
    type: "reddit",
    config: { reddit: { subreddits: ["artificial"] } },
    enabled: true,
  },
  {
    name: "r/deeplearning",
    type: "reddit",
    config: { reddit: { subreddits: ["deeplearning"] } },
    enabled: true,
  },
  {
    name: "r/OpenAI",
    type: "reddit",
    config: { reddit: { subreddits: ["OpenAI"] } },
    enabled: true,
  },
  {
    name: "r/StableDiffusion",
    type: "reddit",
    config: { reddit: { subreddits: ["StableDiffusion"] } },
    enabled: true,
  },
  {
    name: "r/singularity",
    type: "reddit",
    config: { reddit: { subreddits: ["singularity"] } },
    enabled: true,
  },

  // ─────────────────────────────────────────────────
  // Product Hunt
  // ─────────────────────────────────────────────────
  {
    name: "PH AI Products",
    type: "producthunt",
    config: { producthunt: { topic: "artificial-intelligence" } },
    enabled: true,
  },
  {
    name: "PH Developer Tools",
    type: "producthunt",
    config: { producthunt: { topic: "developer-tools" } },
    enabled: true,
  },
];
