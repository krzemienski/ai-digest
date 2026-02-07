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
          className={`px-3 py-1.5 rounded font-mono text-sm transition-all duration-200 min-w-[48px] min-h-[44px] flex items-center justify-center ${
            playbackSpeed === speed
              ? "bg-cyber-cyan text-cyber-bg shadow-neon-cyan"
              : "bg-cyber-overlay text-cyber-text-secondary hover:text-cyber-cyan hover:bg-cyber-overlay/80"
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
