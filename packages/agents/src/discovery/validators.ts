const COMMON_FEED_PATHS = [
  "/feed",
  "/rss",
  "/atom.xml",
  "/feed.xml",
  "/rss.xml",
  "/blog/feed",
  "/index.xml",
  "/feed/atom",
  "/feed/rss",
  "/blog/rss.xml",
  "/blog/atom.xml",
  "/feeds/posts/default",
] as const;

const FETCH_TIMEOUT_MS = 10_000;

interface DiscoveredFeed {
  readonly url: string;
  readonly title: string;
}

interface ValidationResult {
  readonly reachable: boolean;
  readonly contentType: string;
  readonly lastUpdated: string | null;
  readonly itemCount: number | null;
}

function extractFeedTitle(xml: string): string {
  // Try <title>...</title> from the feed
  const titleMatch = xml.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() ?? "Untitled Feed";
}

function countFeedItems(xml: string): number {
  // Count <item> tags (RSS) or <entry> tags (Atom)
  const itemMatches = xml.match(/<item[\s>]/gi);
  const entryMatches = xml.match(/<entry[\s>]/gi);
  return (itemMatches?.length ?? 0) + (entryMatches?.length ?? 0);
}

function extractLastUpdated(xml: string): string | null {
  // Try <lastBuildDate>, <updated>, or <pubDate>
  const patterns = [
    /<lastBuildDate>([^<]+)<\/lastBuildDate>/i,
    /<updated>([^<]+)<\/updated>/i,
    /<pubDate>([^<]+)<\/pubDate>/i,
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match?.[1]) {
      try {
        const date = new Date(match[1].trim());
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        // Skip invalid dates
      }
    }
  }

  return null;
}

function isFeedContent(text: string): boolean {
  const lower = text.slice(0, 2000).toLowerCase();
  return (
    lower.includes("<rss") ||
    lower.includes("<feed") ||
    lower.includes("<channel") ||
    lower.includes("xmlns:atom") ||
    lower.includes("application/rss+xml") ||
    lower.includes("application/atom+xml")
  );
}

function normalizeBaseUrl(domain: string): string {
  const trimmed = domain.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function probeRssFeeds(domain: string): Promise<readonly DiscoveredFeed[]> {
  const baseUrl = normalizeBaseUrl(domain);
  const results: DiscoveredFeed[] = [];

  const probePromises = COMMON_FEED_PATHS.map(async (path) => {
    const feedUrl = `${baseUrl}${path}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(feedUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "AI-Digest-Discovery/1.0",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const text = await response.text();

      if (!isFeedContent(text)) {
        return null;
      }

      const title = extractFeedTitle(text);
      return { url: feedUrl, title } satisfies DiscoveredFeed;
    } catch {
      return null;
    }
  });

  const probeResults = await Promise.allSettled(probePromises);

  for (const result of probeResults) {
    if (result.status === "fulfilled" && result.value !== null) {
      results.push(result.value);
    }
  }

  return results;
}

export async function validateSourceUrl(url: string): Promise<ValidationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "AI-Digest-Discovery/1.0",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, text/html",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        reachable: false,
        contentType: "",
        lastUpdated: null,
        itemCount: null,
      };
    }

    const contentType = response.headers.get("content-type") ?? "unknown";
    const text = await response.text();

    if (isFeedContent(text)) {
      return {
        reachable: true,
        contentType,
        lastUpdated: extractLastUpdated(text),
        itemCount: countFeedItems(text),
      };
    }

    // Not an RSS/Atom feed, but still reachable
    return {
      reachable: true,
      contentType,
      lastUpdated: null,
      itemCount: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Distinguish between timeout and other errors
    const isTimeout = message.includes("abort") || message.includes("timeout");

    return {
      reachable: false,
      contentType: isTimeout ? "timeout" : "error",
      lastUpdated: null,
      itemCount: null,
    };
  }
}
