"use client";

import { useAudioStore } from "@/stores/audio-store";

const SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;

export function SpeedSelector() {
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const setSpeed = useAudioStore((s) => s.setSpeed);

  return (
    <div className="flex items-center justify-center gap-1">
      {SPEEDS.map((speed) => (
        <button
          key={speed}
          type="button"
          onClick={() => setSpeed(speed)}
          className={`px-3 py-1.5 rounded text-sm transition-all duration-200 min-w-[48px] min-h-[44px] flex items-center justify-center ${
            playbackSpeed === speed
              ? "bg-accent text-bg"
              : "bg-surface-elevated text-text-secondary hover:text-accent hover:bg-surface-elevated/80"
          }`}
          aria-label={`Set playback speed to ${speed}x`}
          aria-pressed={playbackSpeed === speed}
        >
          {speed}x
        </button>
      ))}
    </div>
  );
}
