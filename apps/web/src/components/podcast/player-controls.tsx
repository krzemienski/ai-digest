"use client";

import { useAudioStore } from "@/stores/audio-store";

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="3" width="5" height="18" />
      <rect x="14" y="3" width="5" height="18" />
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11,19 2,12 11,5" />
      <polygon points="22,19 13,12 22,5" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13,19 22,12 13,5" />
      <polygon points="2,19 11,12 2,5" />
    </svg>
  );
}

export function PlayerControls() {
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const skipBack = useAudioStore((s) => s.skipBack);
  const skipForward = useAudioStore((s) => s.skipForward);

  return (
    <div className="flex items-center justify-center gap-6">
      <button
        type="button"
        onClick={() => skipBack(15)}
        className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-cyber-text-secondary hover:text-cyber-cyan hover:bg-cyber-overlay transition-all duration-200"
        aria-label="Skip back 15 seconds"
      >
        <SkipBackIcon />
        <span className="text-[10px] font-mono mt-0.5">-15s</span>
      </button>

      <button
        type="button"
        onClick={() => (isPlaying ? pause() : resume())}
        className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200 ${
          isPlaying
            ? "bg-cyber-cyan text-cyber-bg hover:shadow-neon-cyan"
            : "border-2 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 hover:shadow-neon-cyan"
        }`}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        type="button"
        onClick={() => skipForward(30)}
        className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-cyber-text-secondary hover:text-cyber-cyan hover:bg-cyber-overlay transition-all duration-200"
        aria-label="Skip forward 30 seconds"
      >
        <SkipForwardIcon />
        <span className="text-[10px] font-mono mt-0.5">+30s</span>
      </button>
    </div>
  );
}
