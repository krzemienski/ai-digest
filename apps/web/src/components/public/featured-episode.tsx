"use client";

import Link from "next/link";
import { useAudioStore } from "@/stores/audio-store";
import type { Episode } from "@ai-digest/shared";

interface FeaturedEpisodeProps {
  episode: {
    id: string;
    title: string;
    audioUrl: string | null;
    durationSeconds: number | null;
    status: string;
    createdAt: string;
    digestId: string | null;
    audioFormat: string;
  };
  description?: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FeaturedEpisode({ episode, description }: FeaturedEpisodeProps) {
  const canPlay = episode.status === "ready" && episode.audioUrl !== null;

  const handlePlay = () => {
    if (!canPlay) return;
    const episodeData: Episode = {
      id: episode.id,
      digestId: episode.digestId,
      title: episode.title,
      audioUrl: episode.audioUrl,
      durationSeconds: episode.durationSeconds,
      audioFormat: episode.audioFormat,
      status: episode.status as Episode["status"],
      createdAt: episode.createdAt,
    };
    useAudioStore.getState().play(episodeData);
  };

  return (
    <div className="bg-pub-surface border-l-2 border-pub-red p-6 sm:p-8">
      <span className="inline-block text-[10px] uppercase tracking-widest font-medium text-pub-red bg-pub-red/10 px-2 py-0.5">
        LATEST
      </span>

      <Link
        href={`/podcasts/${episode.id}`}
        className="block text-xl sm:text-2xl font-bold text-pub-text mt-3 hover:text-pub-blue transition-colors"
      >
        {episode.title}
      </Link>

      <div className="flex items-center gap-4 mt-2">
        <span className="text-sm text-pub-text-secondary">
          {formatDate(episode.createdAt)}
        </span>
        {episode.durationSeconds && (
          <span className="text-sm text-pub-green">
            {formatDuration(episode.durationSeconds)}
          </span>
        )}
        <span className="text-xs text-pub-blue bg-pub-blue/10 px-2 py-0.5">
          AI Generated
        </span>
      </div>

      {description && (
        <p className="text-sm text-pub-text-secondary mt-3 line-clamp-2">
          {description}
        </p>
      )}

      {canPlay && (
        <button
          type="button"
          onClick={handlePlay}
          className="mt-4 w-12 h-12 rounded-full border-2 border-pub-red text-pub-red hover:bg-pub-red/10 flex items-center justify-center transition-colors"
          aria-label={`Play ${episode.title}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="8,5 19,12 8,19" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
