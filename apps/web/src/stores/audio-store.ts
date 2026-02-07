import { create } from "zustand";
import type { Episode, TranscriptSegment } from "@ai-digest/shared";

interface AudioState {
  // State
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  activeSegmentIndex: number;
  transcript: TranscriptSegment[] | null;

  // Actions
  play: (episode: Episode) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setTranscript: (segments: TranscriptSegment[]) => void;
  skipForward: (seconds?: number) => void;
  skipBack: (seconds?: number) => void;
  close: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
  volume: 1,
  activeSegmentIndex: 0,
  transcript: null,

  play: (episode) => set({
    currentEpisode: episode,
    isPlaying: true,
    currentTime: 0,
    duration: episode.durationSeconds ?? 0,
  }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  seek: (time) => set({ currentTime: time }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => {
    const { transcript } = get();
    const segIdx = transcript
      ? transcript.findIndex((s) => s.startTime <= time && s.endTime > time)
      : 0;
    set({ currentTime: time, activeSegmentIndex: Math.max(0, segIdx) });
  },
  setDuration: (duration) => set({ duration }),
  setTranscript: (segments) => set({ transcript: segments }),
  skipForward: (seconds = 30) => {
    const { currentTime, duration } = get();
    set({ currentTime: Math.min(currentTime + seconds, duration) });
  },
  skipBack: (seconds = 15) => {
    const { currentTime } = get();
    set({ currentTime: Math.max(currentTime - seconds, 0) });
  },
  close: () => set({
    currentEpisode: null,
    isPlaying: false,
    currentTime: 0,
    transcript: null,
  }),
}));
