"use client";

import { useEffect } from "react";
import { useAudioStore } from "@/stores/audio-store";
import { PodcastPlayer } from "@/components/podcast/podcast-player";
import type { Episode } from "@ai-digest/shared";

interface EpisodePlayerLoaderProps {
  episode: Episode;
}

export function EpisodePlayerLoader({ episode }: EpisodePlayerLoaderProps) {
  useEffect(() => {
    const store = useAudioStore.getState();
    if (store.currentEpisode?.id !== episode.id) {
      store.play(episode);
    }
  }, [episode]);

  return <PodcastPlayer />;
}
