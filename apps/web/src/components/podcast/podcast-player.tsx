"use client";

import { useRef, useEffect } from "react";
import { useAudioStore } from "@/stores/audio-store";
import { PlayerControls } from "@/components/podcast/player-controls";
import { ProgressBar } from "@/components/podcast/progress-bar";
import { SpeedSelector } from "@/components/podcast/speed-selector";

function WaveformPlaceholder() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-16 my-6" aria-hidden="true">
      {Array.from({ length: 32 }, (_, i) => {
        const height = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
        return (
          <div
            key={i}
            className="w-1.5 rounded-full bg-accent/30"
            style={{ height: `${Math.min(height, 64)}px` }}
          />
        );
      })}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PodcastPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentEpisode = useAudioStore((s) => s.currentEpisode);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const volume = useAudioStore((s) => s.volume);
  const setCurrentTime = useAudioStore((s) => s.setCurrentTime);
  const setDuration = useAudioStore((s) => s.setDuration);
  const pause = useAudioStore((s) => s.pause);

  // Sync play/pause state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {
        pause();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, pause]);

  // Sync seek with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const diff = Math.abs(audio.currentTime - currentTime);
    if (diff > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync playback speed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Sync volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      pause();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [setCurrentTime, setDuration, pause]);

  if (!currentEpisode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-16 h-16 rounded-full border-2 border-surface-elevated flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </div>
        <p className="text-text-secondary text-lg">
          No episode selected
        </p>
        <p className="font-sans text-text-secondary/60 text-sm mt-2">
          Choose an episode from the library to start listening
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4 py-6 md:px-6">
      {/* Episode info */}
      <div className="text-center mb-4 w-full">
        <h2 className="text-accent text-lg leading-tight truncate">
          {currentEpisode.title}
        </h2>
        <p className="font-sans text-text-secondary text-sm mt-1">
          {formatDate(currentEpisode.createdAt)}
        </p>
      </div>

      {/* Waveform visualization placeholder */}
      <WaveformPlaceholder />

      {/* Progress bar */}
      <div className="w-full mb-6">
        <ProgressBar />
      </div>

      {/* Player controls */}
      <div className="mb-6">
        <PlayerControls />
      </div>

      {/* Speed selector */}
      <div className="w-full">
        <p className="text-center text-xs text-text-secondary mb-2 uppercase tracking-wider">
          Speed
        </p>
        <SpeedSelector />
      </div>

      {/* Hidden audio element */}
      {currentEpisode.audioUrl && (
        <audio
          ref={audioRef}
          src={currentEpisode.audioUrl}
          preload="metadata"
        />
      )}
    </div>
  );
}
