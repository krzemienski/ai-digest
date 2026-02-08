"use client";

import { useAudioStore } from "@/stores/audio-store";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ProgressBar() {
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const seek = useAudioStore((s) => s.seek);

  const remaining = Math.max(0, duration - currentTime);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  return (
    <div className="w-full px-2">
      <div className="relative w-full h-2 rounded-full bg-surface-elevated overflow-hidden mb-1">
        <div
          className="absolute inset-y-0 left-0 bg-accent rounded-full transition-[width] duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={handleChange}
        className="w-full h-2 -mt-3 relative z-10 opacity-0 cursor-pointer"
        style={{ WebkitAppearance: "none" }}
        aria-label="Seek audio position"
      />
      <div className="flex justify-between text-xs text-text-secondary mt-0">
        <span>{formatTime(currentTime)}</span>
        <span>-{formatTime(remaining)}</span>
      </div>
    </div>
  );
}
