"use client";

import { useState, useEffect, useCallback } from "react";

export interface VoiceOption {
  readonly voiceId: string;
  readonly name: string;
  readonly category: string;
  readonly previewUrl: string | null;
  readonly labels: Record<string, string>;
}

interface VoicesApiResponse {
  readonly success: boolean;
  readonly data?: {
    readonly voices: readonly VoiceOption[];
    readonly cached: boolean;
  };
  readonly error?: string;
}

interface UseVoicesResult {
  readonly voices: readonly VoiceOption[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useVoices(): UseVoicesResult {
  const [voices, setVoices] = useState<readonly VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/podcast/voices", {
        credentials: "include",
      });
      const data = (await res.json()) as VoicesApiResponse;

      if (data.success && data.data) {
        setVoices(data.data.voices);
      } else {
        setError(data.error ?? "Failed to fetch voices");
      }
    } catch {
      setError("Network error: could not load voices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVoices();
  }, [fetchVoices]);

  const refetch = useCallback(() => {
    void fetchVoices();
  }, [fetchVoices]);

  return { voices, loading, error, refetch };
}
