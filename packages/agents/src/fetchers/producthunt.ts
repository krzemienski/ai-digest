import type { SourceConfig } from "@ai-digest/shared";
import type { RawFetchResult } from "./types";

interface PHPost {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  votesCount: number;
  createdAt: string;
  makers: Array<{ name: string }>;
  topics: { edges: Array<{ node: { name: string } }> };
}

interface PHResponse {
  data: {
    posts: {
      edges: Array<{ node: PHPost }>;
    };
  };
}

export async function fetchProductHunt(
  config: NonNullable<SourceConfig["producthunt"]>,
): Promise<RawFetchResult[]> {
  const token = process.env.PRODUCTHUNT_TOKEN;
  if (!token) {
    console.warn("[ProductHunt] No PRODUCTHUNT_TOKEN set, skipping");
    return [];
  }

  const topic = config.topic ?? "artificial-intelligence";
  const query = `
    query {
      posts(first: 20, topic: "${topic}", order: VOTES) {
        edges {
          node {
            id
            name
            tagline
            description
            url
            votesCount
            createdAt
            makers { name }
            topics { edges { node { name } } }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(
      "https://api.producthunt.com/v2/api/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      },
    );

    if (!response.ok) {
      console.error(`[ProductHunt] API error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as PHResponse;

    return data.data.posts.edges.map(({ node }) => ({
      source: "producthunt" as const,
      sourceId: node.id,
      sourceUrl: node.url,
      title: node.name,
      summary: node.tagline,
      content: node.description,
      authors: node.makers.map((m) => m.name),
      publishedAt: new Date(node.createdAt),
      metadata: {
        votes: node.votesCount,
        topics: node.topics.edges.map((e) => e.node.name),
      },
    }));
  } catch (error) {
    console.error("[ProductHunt] Failed to fetch:", error);
    return [];
  }
}
