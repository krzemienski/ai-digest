import { db, queries } from "@ai-digest/db";
import { FeaturedEpisode } from "@/components/public/featured-episode";
import { EpisodeGrid } from "@/components/public/episode-grid";
import { SubscribeCTA } from "@/components/public/subscribe-cta";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Episodes | AI Digest",
  description: "Browse all AI Digest podcast episodes",
  openGraph: {
    title: "All Episodes | AI Digest",
    description: "Browse all AI Digest podcast episodes",
    type: "website",
    url: "https://ai-digest-ivory.vercel.app/podcasts",
  },
};

export default async function EpisodesPage() {
  const episodes = await queries.getReadyEpisodes(db, { limit: 50 });

  // With noUncheckedIndexedAccess, destructuring gives T | undefined
  const latest = episodes[0];
  const rest = episodes.slice(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-pub-text">All Episodes</h1>
        <p className="text-sm text-pub-text-secondary mt-1">
          {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
        </p>
      </div>

      {/* Featured Episode */}
      {latest && (
        <FeaturedEpisode
          episode={{
            id: latest.id,
            title: latest.title,
            audioUrl: latest.audioUrl,
            durationSeconds: latest.durationSeconds,
            status: latest.status,
            createdAt: String(latest.createdAt),
            digestId: latest.digestId,
            audioFormat: latest.audioFormat ?? "mp3_44100_128",
          }}
        />
      )}

      {/* Spacer */}
      <div className="mt-8" />

      {/* Episode Grid */}
      {rest.length > 0 && (
        <EpisodeGrid
          episodes={rest.map((ep) => ({
            id: ep.id,
            title: ep.title,
            audioUrl: ep.audioUrl,
            durationSeconds: ep.durationSeconds,
            status: ep.status,
            createdAt: String(ep.createdAt),
            digestId: ep.digestId,
            audioFormat: ep.audioFormat ?? "mp3_44100_128",
          }))}
        />
      )}

      {/* Subscribe CTA */}
      <div className="py-12">
        <SubscribeCTA />
      </div>
    </div>
  );
}
