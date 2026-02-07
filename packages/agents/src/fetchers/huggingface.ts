import type { SourceConfig } from "@ai-digest/shared";
import type { RawFetchResult } from "./types";

interface HFModel {
  id: string;
  modelId: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag: string | null;
  lastModified: string;
  createdAt: string;
}

export async function fetchHuggingFace(
  config: NonNullable<SourceConfig["huggingface"]>,
): Promise<RawFetchResult[]> {
  const minDownloads = config.minDownloads ?? 100;
  const tasks = config.tasks ?? [
    "text-generation",
    "image-classification",
    "text-to-image",
  ];

  const results: RawFetchResult[] = [];

  for (const task of tasks) {
    const url = `https://huggingface.co/api/models?pipeline_tag=${task}&sort=modified&direction=-1&limit=20`;
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const models = (await response.json()) as HFModel[];

      for (const model of models) {
        if (model.downloads < minDownloads) continue;
        results.push({
          source: "huggingface" as const,
          sourceId: model.id,
          sourceUrl: `https://huggingface.co/${model.id}`,
          title: model.modelId,
          summary: `${model.pipeline_tag ?? "model"} by ${model.author} — ${model.downloads.toLocaleString()} downloads, ${model.likes} likes`,
          authors: [model.author],
          publishedAt: new Date(model.createdAt),
          metadata: {
            downloads: model.downloads,
            likes: model.likes,
            tags: model.tags,
            pipelineTag: model.pipeline_tag,
            lastModified: model.lastModified,
          },
        });
      }
    } catch (error) {
      console.error(`[HuggingFace] Failed to fetch task ${task}:`, error);
    }
  }

  return results;
}
