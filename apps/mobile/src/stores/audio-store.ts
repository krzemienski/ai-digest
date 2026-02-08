import { create } from "zustand";
import type { Episode, Transcript } from "@ai-digest/shared";

interface AudioState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  transcript: Transcript | null;
  isExpanded: boolean;
  isBuffering: boolean;

  play: (episode: Episode, transcript?: Transcript | null) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  expandPlayer: () => void;
  collapsePlayer: () => void;
  updateProgress: (currentTime: number, duration: number) => void;
  setBuffering: (isBuffering: boolean) => void;
  stop: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
  transcript: null,
  isExpanded: false,
  isBuffering: false,

  play: (episode, transcript = null) => {
    set({
      currentEpisode: episode,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      transcript: transcript ?? null,
      isExpanded: false,
      isBuffering: true,
    });
    // TrackPlayer integration will be added in Task 3.6
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  seek: (time) => {
    set({ currentTime: time });
    // TrackPlayer.seekTo will be wired in Task 3.6
  },

  setSpeed: (speed) => {
    set({ playbackSpeed: speed });
    // TrackPlayer.setRate will be wired in Task 3.6
  },

  expandPlayer: () => set({ isExpanded: true }),
  collapsePlayer: () => set({ isExpanded: false }),

  updateProgress: (currentTime, duration) => set({ currentTime, duration }),
  setBuffering: (isBuffering) => set({ isBuffering }),

  stop: () =>
    set({
      currentEpisode: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      transcript: null,
      isExpanded: false,
      isBuffering: false,
    }),
}));
