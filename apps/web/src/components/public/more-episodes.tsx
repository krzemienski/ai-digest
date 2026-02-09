import Link from "next/link";
import { EpisodeGridCard } from "./episode-grid-card";

interface Episode {
  id: string;
  title: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  status: string;
  createdAt: string;
  digestId: string | null;
  audioFormat: string;
}

interface MoreEpisodesProps {
  episodes: Episode[];
}

export function MoreEpisodes({ episodes }: MoreEpisodesProps) {
  const displayEpisodes = episodes.slice(0, 3);

  return (
    <div className="py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-pub-text">More Episodes</h2>
        <Link
          href="/podcasts"
          className="text-sm text-pub-blue hover:text-pub-blue-hover transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayEpisodes.map((episode) => (
          <EpisodeGridCard key={episode.id} episode={episode} />
        ))}
      </div>
    </div>
  );
}
