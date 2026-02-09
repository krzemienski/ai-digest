"use client";

import { useAudioStore } from "@/stores/audio-store";
import type { Episode } from "@ai-digest/shared";
import { WaveformVisual } from "./waveform-visual";

interface HeroPlayerProps {
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0m";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function HeroPlayer({ episode }: HeroPlayerProps) {
  const handlePlay = () => {
    // Build Episode object from props
    const episodeObj: Episode = {
      id: episode.id,
      title: episode.title,
      audioUrl: episode.audioUrl,
      durationSeconds: episode.durationSeconds,
      status: episode.status as Episode["status"],
      createdAt: episode.createdAt,
      digestId: episode.digestId,
      audioFormat: episode.audioFormat,
    };
    useAudioStore.getState().play(episodeObj);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left column: Text */}
        <div>
          <div className="text-[11px] uppercase tracking-widest font-medium text-pub-red">
            LATEST EPISODE
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pub-text leading-tight mt-4">
            {episode.title}
          </h1>
          <div className="flex items-center mt-4">
            <span className="text-sm text-pub-text-secondary">
              {formatDate(episode.createdAt)}
            </span>
            <span className="text-sm text-pub-green ml-4">
              {formatDuration(episode.durationSeconds)}
            </span>
          </div>
          <button
            onClick={handlePlay}
            className="mt-6 w-14 h-14 rounded-full border-2 border-pub-red text-pub-red hover:bg-pub-red/10 flex items-center justify-center transition-colors"
            aria-label="Play episode"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6"
              fill="currentColor"
            >
              <polygon points="9,6 19,12 9,18" />
            </svg>
          </button>
        </div>

        {/* Right column: Visual */}
        <div>
          <WaveformVisual className="h-32 lg:h-48" />
        </div>
      </div>
    </div>
  );
}
