"use client";

import { useEffect, useState } from "react";
import { SearchResultCard } from "./search-result-card";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  rank?: number;
}

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json() as { success: boolean; data: SearchResultItem[] };
        if (!cancelled && data.success) {
          setResults(data.data);
        }
      } catch (_error) {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${String(i)}`} className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-sm">
          No results found for &apos;{query}&apos;
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-secondary mb-4">
        {results.length} result{results.length !== 1 ? "s" : ""} found
      </p>
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard
            key={result.id}
            title={result.title}
            summary={result.summary ?? ""}
            source={result.source}
            sourceUrl={result.source_url}
            score={result.rank}
          />
        ))}
      </div>
    </div>
  );
}
