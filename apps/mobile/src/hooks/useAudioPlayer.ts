import { useEffect, useCallback } from "react";
import { useProgress, usePlaybackState } from "react-native-track-player";
import { State } from "react-native-track-player";
import { useAudioStore } from "@/stores/audio-store";
import {
  setupAudioService,
  addTrack,
  playTrack,
  pauseTrack,
  seekTo,
  setPlaybackRate,
} from "@/services/audio-service";
import type { AddTrack } from "react-native-track-player";
import type { Episode } from "@ai-digest/shared";

export function useAudioPlayer() {
  const store = useAudioStore();
  const progress = useProgress(1000);
  const playbackState = usePlaybackState();

  useEffect(() => {
    void setupAudioService();
  }, []);

  // Sync TrackPlayer progress to Zustand store
  useEffect(() => {
    if (store.currentEpisode && progress.duration > 0) {
      store.updateProgress(progress.position, progress.duration);
    }
  }, [progress.position, progress.duration]);

  // Sync TrackPlayer playback state to Zustand store
  useEffect(() => {
    const state = playbackState.state;
    if (state === undefined) return;

    if (state === State.Playing) {
      store.setBuffering(false);
      if (!store.isPlaying) {
        store.resume();
      }
    } else if (state === State.Paused) {
      store.setBuffering(false);
      if (store.isPlaying) {
        store.pause();
      }
    } else if (state === State.Buffering || state === State.Loading) {
      store.setBuffering(true);
    } else if (state === State.Stopped || state === State.None) {
      store.setBuffering(false);
    }
  }, [playbackState.state]);

  const play = useCallback(async (episode: Episode) => {
    const track: AddTrack = {
      id: episode.id,
      url: episode.audioUrl ?? "",
      title: episode.title,
      artist: "AI Digest",
      duration: episode.durationSeconds ?? undefined,
    };
    await addTrack(track);
    await playTrack();
    store.play(episode);
  }, []);

  const pause = useCallback(async () => {
    await pauseTrack();
    store.pause();
  }, []);

  const resume = useCallback(async () => {
    await playTrack();
    store.resume();
  }, []);

  const seek = useCallback(async (time: number) => {
    await seekTo(time);
    store.seek(time);
  }, []);

  const setSpeed = useCallback(async (speed: number) => {
    await setPlaybackRate(speed);
    store.setSpeed(speed);
  }, []);

  return {
    currentEpisode: store.currentEpisode,
    isPlaying: store.isPlaying,
    currentTime: store.currentTime,
    duration: store.duration,
    playbackSpeed: store.playbackSpeed,
    transcript: store.transcript,
    isExpanded: store.isExpanded,
    isBuffering: store.isBuffering,
    expandPlayer: store.expandPlayer,
    collapsePlayer: store.collapsePlayer,
    stop: store.stop,
    play,
    pause,
    resume,
    seek,
    setSpeed,
  };
}
