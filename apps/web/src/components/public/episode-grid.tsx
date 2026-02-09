import { EpisodeGridCard } from "./episode-grid-card";

interface EpisodeGridProps {
  episodes: Array<{
    id: string;
    title: string;
    audioUrl: string | null;
    durationSeconds: number | null;
    status: string;
    createdAt: string;
    digestId: string | null;
    audioFormat: string;
  }>;
}

export function EpisodeGrid({ episodes }: EpisodeGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {episodes.map((episode) => (
        <EpisodeGridCard key={episode.id} episode={episode} />
      ))}
    </div>
  );
}
