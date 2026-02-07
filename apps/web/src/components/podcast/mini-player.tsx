"use client";

import Link from "next/link";
import { useAudioStore } from "@/stores/audio-store";

function MiniPlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function MiniPauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="3" width="5" height="18" />
      <rect x="14" y="3" width="5" height="18" />
    </svg>
  );
}

export function MiniPlayer() {
  const currentEpisode = useAudioStore((s) => s.currentEpisode);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);

  if (!currentEpisode) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-cyber-surface border-t border-cyber-overlay">
      {/* Thin progress bar at top */}
      <div className="h-1 w-full bg-cyber-overlay">
        <div
          className="h-full bg-cyber-cyan transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 h-14">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isPlaying) {
              pause();
            } else {
              resume();
            }
          }}
          className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-cyber-cyan text-cyber-bg hover:shadow-neon-cyan transition-shadow duration-200"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <MiniPauseIcon /> : <MiniPlayIcon />}
        </button>

        {/* Episode title — link to full player */}
        <Link
          href={`/podcasts/${currentEpisode.id}`}
          className="flex-1 min-w-0"
        >
          <p className="font-mono text-sm text-cyber-text truncate">
            {currentEpisode.title}
          </p>
        </Link>
      </div>
    </div>
  );
}
