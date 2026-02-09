"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAudioStore } from "@/stores/audio-store";
import type { Episode } from "@ai-digest/shared";

interface EpisodeCardProps {
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
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function PlaySmallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

const statusColorMap: Record<string, string> = {
  ready: "#22c55e",
  pending: "#f59e0b",
  generating: "#3b82f6",
  failed: "#e11d48",
};

export function EpisodeCard({ episode }: EpisodeCardProps) {
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
    <Card className="flex items-center gap-4">
      {/* Play button */}
      {canPlay ? (
        <button
          type="button"
          onClick={handlePlay}
          className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border-2 border-accent text-accent hover:bg-accent/10 hover:transition-all duration-200"
          aria-label={`Play ${episode.title}`}
        >
          <PlaySmallIcon />
        </button>
      ) : (
        <div className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border-2 border-surface-elevated text-text-secondary">
          <PlaySmallIcon />
        </div>
      )}

      {/* Episode info */}
      <div className="flex-1 min-w-0">
        <Link href={`/podcasts/${episode.id}`} className="hover:underline">
          <h3 className="text-sm text-text-primary truncate">
            {episode.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-sans text-xs text-text-secondary">
            {new Date(episode.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs text-text-secondary">
            {formatDuration(episode.durationSeconds)}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <Badge color={statusColorMap[episode.status] ?? "#3b82f6"}>
        {episode.status}
      </Badge>
    </Card>
  );
}
