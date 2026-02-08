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
  const currentEpisode = useAudioStore((s) => s.currentEpisode);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const transcript = useAudioStore((s) => s.transcript);
  const isExpanded = useAudioStore((s) => s.isExpanded);
  const isBuffering = useAudioStore((s) => s.isBuffering);
  const expandPlayer = useAudioStore((s) => s.expandPlayer);
  const collapsePlayer = useAudioStore((s) => s.collapsePlayer);
  const stop = useAudioStore((s) => s.stop);

  const progress = useProgress(1000);
  const playbackState = usePlaybackState();

  useEffect(() => {
    void setupAudioService();
  }, []);

  // Sync TrackPlayer progress to Zustand store
  useEffect(() => {
    const { currentEpisode: ep, updateProgress } = useAudioStore.getState();
    if (ep && progress.duration > 0) {
      updateProgress(progress.position, progress.duration);
    }
  }, [progress.position, progress.duration]);

  // Sync TrackPlayer playback state to Zustand store
  useEffect(() => {
    const state = playbackState.state;
    if (state === undefined) return;

    const store = useAudioStore.getState();

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
    useAudioStore.getState().play(episode);
  }, []);

  const pause = useCallback(async () => {
    await pauseTrack();
    useAudioStore.getState().pause();
  }, []);

  const resume = useCallback(async () => {
    await playTrack();
    useAudioStore.getState().resume();
  }, []);

  const seek = useCallback(async (time: number) => {
    await seekTo(time);
    useAudioStore.getState().seek(time);
  }, []);

  const setSpeed = useCallback(async (speed: number) => {
    await setPlaybackRate(speed);
    useAudioStore.getState().setSpeed(speed);
  }, []);

  return {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    transcript,
    isExpanded,
    isBuffering,
    expandPlayer,
    collapsePlayer,
    stop,
    play,
    pause,
    resume,
    seek,
    setSpeed,
  };
}
