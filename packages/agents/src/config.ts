import type { DigestConfig } from "@ai-digest/shared";

export const defaultConfig: DigestConfig = {
  topics: [
    {
      name: "Large Language Models",
      keywords: ["llm", "gpt", "claude", "gemini", "language model"],
      weight: 1.5,
    },
    {
      name: "Computer Vision",
      keywords: [
        "vision",
        "image",
        "diffusion",
        "stable diffusion",
        "midjourney",
      ],
      weight: 1.0,
    },
    {
      name: "AI Infrastructure",
      keywords: ["mlops", "gpu", "training", "inference", "deployment"],
      weight: 1.0,
    },
    {
      name: "AI Safety",
      keywords: ["alignment", "safety", "ethics", "regulation", "bias"],
      weight: 1.2,
    },
    {
      name: "Open Source AI",
      keywords: [
        "open source",
        "huggingface",
        "llama",
        "mistral",
        "weights",
      ],
      weight: 1.3,
    },
  ],
  scoring: {
    noveltyWeight: 0.3,
    impactWeight: 0.4,
    relevanceWeight: 0.3,
    minScore: 0.4,
  },
  synthesis: {
    maxItems: 25,
    style: "editorial",
  },
  pipeline: {
    maxBudgetUsd: 5.0,
    schedule: "0 6 * * *",
    enablePodcast: true,
    enableNewsletter: true,
  },
};
