"use client";

import Link from "next/link";
import { useAudioStore } from "@/stores/audio-store";
import type { Episode } from "@ai-digest/shared";

interface EpisodeGridCardProps {
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
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PlaySmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

export function EpisodeGridCard({ episode }: EpisodeGridCardProps) {
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
    <div className="bg-pub-surface p-4 hover:border hover:border-pub-border transition-all group">
      {/* Top row: play button + duration */}
      <div className="flex items-center justify-between">
        {canPlay ? (
          <button
            type="button"
            onClick={handlePlay}
            className="w-9 h-9 rounded-full border border-pub-red text-pub-red hover:bg-pub-red/10 flex items-center justify-center transition-all"
            aria-label={`Play ${episode.title}`}
          >
            <PlaySmallIcon />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-full border border-gray-600 text-gray-600 flex items-center justify-center">
            <PlaySmallIcon />
          </div>
        )}
        <span className="text-xs text-pub-green">
          {formatDuration(episode.durationSeconds)}
        </span>
      </div>

      {/* Title */}
      <Link href={`/podcasts/${episode.id}`} className="block mt-3">
        <h3 className="text-pub-text font-semibold text-sm line-clamp-2 hover:underline">
          {episode.title}
        </h3>
      </Link>

      {/* Date */}
      <p className="text-xs text-pub-text-secondary mt-2">
        {formatDate(episode.createdAt)}
      </p>
    </div>
  );
}
