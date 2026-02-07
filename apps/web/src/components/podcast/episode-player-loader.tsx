"use client";

import { useEffect, useState } from "react";
import { useAudioStore } from "@/stores/audio-store";
import { PodcastPlayer } from "@/components/podcast/podcast-player";
import { TranscriptView } from "@/components/podcast/transcript-view";
import { TranscriptSearch } from "@/components/podcast/transcript-search";
import type { Episode, TranscriptSegment } from "@ai-digest/shared";

interface EpisodePlayerLoaderProps {
  episode: Episode;
  transcript?: TranscriptSegment[] | null;
}

export function EpisodePlayerLoader({ episode, transcript }: EpisodePlayerLoaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const store = useAudioStore.getState();
    if (store.currentEpisode?.id !== episode.id) {
      store.play(episode);
    }
    if (transcript && transcript.length > 0) {
      useAudioStore.getState().setTranscript(transcript);
    }
  }, [episode, transcript]);

  const hasSegments = transcript && transcript.length > 0;

  return (
    <>
      <PodcastPlayer />
      {hasSegments && (
        <div className="mt-8">
          <h3 className="font-mono text-lg font-bold text-cyber-cyan mb-4">Transcript</h3>
          <TranscriptSearch value={searchQuery} onChange={setSearchQuery} />
          <TranscriptView segments={transcript} searchQuery={searchQuery} />
        </div>
      )}
    </>
  );
}
