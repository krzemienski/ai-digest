import type { SourceConfig } from "@ai-digest/shared";
import type { RawFetchResult } from "./types";

interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  topics: string[];
  owner: { login: string };
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

export async function fetchGithub(
  config: NonNullable<SourceConfig["github"]>,
): Promise<RawFetchResult[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const createdAfterDays = config.createdAfterDays ?? 7;
  const since = new Date(Date.now() - createdAfterDays * 24 * 60 * 60 * 1000);
  const sinceStr = since.toISOString().split("T")[0] as string;

  const minStars = config.minStars ?? 10;
  const query = encodeURIComponent(
    `${config.query} created:>${sinceStr} stars:>=${minStars}`,
  );
  const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`;

  try {
    const response = await fetch(url, { headers });

    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
    if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) < 10) {
      console.warn(
        "[GitHub] Rate limit low:",
        rateLimitRemaining,
        "remaining",
      );
    }

    if (!response.ok) {
      console.error(
        `[GitHub] API error: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = (await response.json()) as GitHubSearchResponse;

    return data.items.map((repo) => ({
      source: "github" as const,
      sourceId: String(repo.id),
      sourceUrl: repo.html_url,
      title: repo.full_name,
      summary: repo.description ?? "",
      authors: [repo.owner.login],
      publishedAt: new Date(repo.created_at),
      metadata: {
        stars: repo.stargazers_count,
        language: repo.language,
        topics: repo.topics,
        updatedAt: repo.updated_at,
      },
    }));
  } catch (error) {
    console.error("[GitHub] Failed to fetch:", error);
    return [];
  }
}
