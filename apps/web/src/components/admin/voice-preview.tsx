"use client";

import { useState, useCallback } from "react";

interface VoicePreviewProps {
  readonly voiceId: string;
  readonly text?: string;
  readonly settings: {
    readonly stability: number;
    readonly similarity_boost: number;
    readonly speed: number;
    readonly style: number;
  };
}

interface PreviewResponse {
  readonly success: boolean;
  readonly data?: {
    readonly message: string;
    readonly voiceId: string;
  };
  readonly error?: string;
}

export function VoicePreview({
  voiceId,
  text = "Hello, welcome to AI Digest podcast.",
  settings,
}: VoicePreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handlePreview = useCallback(async () => {
    if (!voiceId.trim()) {
      setError("Please enter a voice ID first");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/podcast/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId, settings }),
      });

      const data = (await res.json()) as PreviewResponse;

      if (data.success && data.data) {
        setMessage(data.data.message);
      } else {
        setError(data.error ?? "Preview failed");
      }
    } catch {
      setError("Network error: could not generate preview");
    } finally {
      setLoading(false);
    }
  }, [voiceId, text, settings]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={loading || !voiceId.trim()}
        onClick={() => void handlePreview()}
        className="bg-cyber-surface border border-cyber-cyan text-cyber-cyan font-mono text-sm px-4 h-9 rounded hover:bg-cyber-cyan/10 hover:shadow-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Preview Voice"}
      </button>
      {message !== null && (
        <span className="font-mono text-xs text-cyber-text-secondary">{message}</span>
      )}
      {error !== null && (
        <span className="font-mono text-xs text-cyber-magenta">{error}</span>
      )}
    </div>
  );
}
