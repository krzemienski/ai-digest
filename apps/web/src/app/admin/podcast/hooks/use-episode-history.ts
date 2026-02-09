"use client";

import { useState, useEffect, useCallback } from "react";

export interface EpisodeHistoryItem {
  readonly id: string;
  readonly digestId: string;
  readonly title: string;
  readonly status: string;
  readonly audioUrl: string | null;
  readonly durationSeconds: number | null;
  readonly targetDurationMinutes: number | null;
  readonly model: string | null;
  readonly style: string | null;
  readonly costUsd: number | null;
  readonly createdAt: string;
}

interface HistoryApiResponse {
  readonly success: boolean;
  readonly data?: {
    readonly episodes: readonly EpisodeHistoryItem[];
    readonly pagination: {
      readonly page: number;
      readonly limit: number;
      readonly total: number;
      readonly totalPages: number;
    };
  };
  readonly error?: string;
}

interface UseEpisodeHistoryResult {
  readonly episodes: readonly EpisodeHistoryItem[];
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
  readonly loading: boolean;
  readonly error: string | null;
  readonly goToPage: (page: number) => void;
  readonly refetch: () => void;
}

const PAGE_SIZE = 10;

export function useEpisodeHistory(): UseEpisodeHistoryResult {
  const [episodes, setEpisodes] = useState<readonly EpisodeHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/podcast/history?page=${targetPage}&limit=${PAGE_SIZE}`,
        { credentials: "include" }
      );
      const data = (await res.json()) as HistoryApiResponse;

      if (data.success && data.data) {
        setEpisodes(data.data.episodes);
        setPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      } else {
        setError(data.error ?? "Failed to fetch history");
      }
    } catch {
      setError("Network error: could not load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(1);
  }, [fetchPage]);

  const goToPage = useCallback(
    (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages) return;
      void fetchPage(targetPage);
    },
    [fetchPage, totalPages]
  );

  const refetch = useCallback(() => {
    void fetchPage(page);
  }, [fetchPage, page]);

  return { episodes, page, totalPages, total, loading, error, goToPage, refetch };
}
