import { XMLParser } from "fast-xml-parser";
import type { SourceConfig } from "@ai-digest/shared";
import type { RawFetchResult } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchArxiv(
  config: NonNullable<SourceConfig["arxiv"]>,
): Promise<RawFetchResult[]> {
  const maxResults = config.maxResults ?? 50;
  const categoryQuery = config.categories.map((c) => `cat:${c}`).join("+OR+");
  const url = `http://export.arxiv.org/api/query?search_query=${categoryQuery}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;

  try {
    await delay(3000); // ArXiv requires 3-second delay between requests

    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `[ArXiv] API error: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const xml = await response.text();
    const parsed = parser.parse(xml) as {
      feed?: {
        entry?:
          | ArxivEntry
          | ArxivEntry[];
      };
    };

    const entries = parsed?.feed?.entry;
    if (!entries) {
      return [];
    }

    const items = Array.isArray(entries) ? entries : [entries];

    return items.map((entry) => {
      const authors = Array.isArray(entry.author)
        ? entry.author.map((a) => a.name)
        : entry.author && typeof entry.author === "object"
          ? [entry.author.name]
          : [];

      const links = Array.isArray(entry.link) ? entry.link : [entry.link];
      const pdfLink = (links as ArxivLink[]).find(
        (l) => l["@_type"] === "application/pdf",
      );

      const categories = Array.isArray(entry.category)
        ? entry.category.map((c) => c["@_term"])
        : entry.category && typeof entry.category === "object"
          ? [entry.category["@_term"]]
          : [];

      const id = String(entry.id ?? "");

      return {
        source: "arxiv" as const,
        sourceId: id,
        sourceUrl: id,
        title: String(entry.title ?? "").replace(/\n/g, " ").trim(),
        summary: String(entry.summary ?? "").replace(/\n/g, " ").trim(),
        content: String(entry.summary ?? ""),
        authors,
        publishedAt: new Date(String(entry.published ?? "")),
        metadata: {
          categories,
          pdfUrl: pdfLink ? String(pdfLink["@_href"]) : null,
          updatedAt: String(entry.updated ?? ""),
        },
      };
    });
  } catch (error) {
    console.error("[ArXiv] Failed to fetch:", error);
    return [];
  }
}

interface ArxivAuthor {
  name: string;
}

interface ArxivLink {
  "@_href": string;
  "@_type"?: string;
  "@_rel"?: string;
}

interface ArxivCategory {
  "@_term": string;
}

interface ArxivEntry {
  id?: string;
  title?: string;
  summary?: string;
  published?: string;
  updated?: string;
  author?: ArxivAuthor | ArxivAuthor[];
  link?: ArxivLink | ArxivLink[];
  category?: ArxivCategory | ArxivCategory[];
}
