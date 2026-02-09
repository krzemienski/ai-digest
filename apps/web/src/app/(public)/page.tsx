import type { Metadata } from "next";
import { db, queries } from "@ai-digest/db";
import { HeroPlayer } from "@/components/public/hero-player";
import { EpisodeGrid } from "@/components/public/episode-grid";
import { SubscribeCTA } from "@/components/public/subscribe-cta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Digest — AI News You Can Listen To",
  description:
    "Weekly AI-curated podcast covering the latest in artificial intelligence. Listen free.",
  openGraph: {
    title: "AI Digest — AI News You Can Listen To",
    description:
      "Weekly AI-curated podcast covering the latest in artificial intelligence. Listen free.",
    type: "website",
    url: "https://ai-digest-ivory.vercel.app",
  },
};

export default async function PublicLandingPage() {
  const episodes = await queries.getReadyEpisodes(db, { limit: 7 });

  if (episodes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-pub-text-secondary text-lg">No episodes yet</p>
      </div>
    );
  }

  const [latest, ...recent] = episodes;

  // Check if latest exists due to noUncheckedIndexedAccess
  if (!latest) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-pub-text-secondary text-lg">No episodes yet</p>
      </div>
    );
  }

  // Map episode data for HeroPlayer
  const heroEpisode = {
    id: latest.id,
    title: latest.title,
    audioUrl: latest.audioUrl,
    durationSeconds: latest.durationSeconds,
    status: latest.status,
    createdAt: String(latest.createdAt),
    digestId: latest.digestId,
    audioFormat: latest.audioFormat ?? "mp3_44100_128",
  };

  // Map recent episodes for EpisodeGrid (up to 6)
  const recentEpisodes = recent.slice(0, 6).map((ep) => ({
    id: ep.id,
    title: ep.title,
    audioUrl: ep.audioUrl,
    durationSeconds: ep.durationSeconds,
    status: ep.status,
    createdAt: String(ep.createdAt),
    digestId: ep.digestId,
    audioFormat: ep.audioFormat ?? "mp3_44100_128",
  }));

  return (
    <div>
      {/* Hero Section with Latest Episode */}
      <HeroPlayer episode={heroEpisode} />

      {/* Recent Episodes Section */}
      {recentEpisodes.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-bold text-pub-text mb-6 mt-4">
            Recent Episodes
          </h2>
          <EpisodeGrid episodes={recentEpisodes} />
        </div>
      )}

      {/* About Section */}
      <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-lg font-bold text-pub-text mb-4">About AI Digest</h2>
        <p className="text-sm text-pub-text-secondary leading-relaxed max-w-2xl">
          AI Digest is a weekly AI-generated podcast that curates and summarizes the most
          important developments in artificial intelligence. Our pipeline fetches stories from
          RSS feeds, GitHub, ArXiv, Hacker News, Reddit, and more — then synthesizes them
          into a listenable episode powered by Claude and ElevenLabs.
        </p>
      </section>

      {/* Subscribe CTA */}
      <SubscribeCTA />
    </div>
  );
}
