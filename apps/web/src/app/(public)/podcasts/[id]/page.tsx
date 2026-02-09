import { db, queries } from "@ai-digest/db";
import { EpisodePlayerLoader } from "@/components/podcast/episode-player-loader";
import { ShareButtons } from "@/components/public/share-buttons";
import { MoreEpisodes } from "@/components/public/more-episodes";
import { SubscribeCTA } from "@/components/public/subscribe-cta";
import type { Episode, TranscriptSegment } from "@ai-digest/shared";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const episode = await queries.getEpisodeById(db, id);
  if (!episode) {
    return { title: "Episode Not Found | AI Digest" };
  }
  return {
    title: `${episode.title} | AI Digest Podcast`,
    description: `Listen to ${episode.title} — AI Digest Podcast`,
    openGraph: {
      title: episode.title,
      description: `Listen to ${episode.title} — AI Digest Podcast`,
      siteName: "AI Digest",
      type: "website",
      url: `https://ai-digest-ivory.vercel.app/podcasts/${id}`,
      audio: episode.audioUrl
        ? [
            {
              url: episode.audioUrl,
              type: "audio/mpeg",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: episode.title,
      description: `Listen to ${episode.title} — AI Digest Podcast`,
    },
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await queries.getEpisodeWithTranscript(db, id);

  // 404 handling
  if (!result) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-pub-text mb-4">Episode Not Found</h1>
          <p className="text-sm text-pub-text-secondary">
            The requested episode does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Build Episode object
  const episode: Episode = {
    id: result.id,
    digestId: result.digestId,
    title: result.title,
    audioUrl: result.audioUrl,
    durationSeconds: result.durationSeconds,
    audioFormat: result.audioFormat ?? "mp3_44100_128",
    status: result.status as Episode["status"],
    createdAt: String(result.createdAt),
  };

  // Get transcript segments
  const transcriptSegments: TranscriptSegment[] | null =
    result.transcript?.segments ?? null;

  // Fetch more episodes
  const moreEpisodesRaw = await queries.getReadyEpisodes(db, { limit: 4 });

  // Filter out current episode and take first 3
  const moreEpisodes = moreEpisodesRaw
    .filter((ep) => ep.id !== id)
    .slice(0, 3)
    .map((ep) => ({
      id: ep.id,
      title: ep.title,
      audioUrl: ep.audioUrl,
      durationSeconds: ep.durationSeconds,
      status: ep.status,
      createdAt: String(ep.createdAt),
      digestId: ep.digestId,
      audioFormat: ep.audioFormat ?? "mp3_44100_128",
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    datePublished: episode.createdAt,
    duration: episode.durationSeconds
      ? `PT${Math.floor(episode.durationSeconds / 60)}M${episode.durationSeconds % 60}S`
      : undefined,
    url: `https://ai-digest-ivory.vercel.app/podcasts/${id}`,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "AI Digest",
      url: "https://ai-digest-ivory.vercel.app",
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back link */}
      <Link
        href="/podcasts"
        className="inline-block text-sm text-pub-blue hover:text-pub-blue-hover transition-colors"
      >
        ← All Episodes
      </Link>

      {/* Episode title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-pub-text mt-4">
        {episode.title}
      </h1>

      {/* Metadata row */}
      <div className="flex items-center mt-3">
        <span className="text-sm text-pub-text-secondary">
          {formatDate(episode.createdAt)}
        </span>
        {episode.durationSeconds && (
          <span className="text-sm text-pub-green ml-3">
            {formatDuration(episode.durationSeconds)}
          </span>
        )}
      </div>

      {/* Share buttons */}
      <div className="mt-4">
        <ShareButtons
          url={`https://ai-digest-ivory.vercel.app/podcasts/${id}`}
          title={episode.title}
        />
      </div>

      {/* Player section */}
      <div className="mt-8">
        <EpisodePlayerLoader episode={episode} transcript={transcriptSegments} />
      </div>

      {/* Divider + More Episodes */}
      {moreEpisodes.length > 0 && (
        <div className="mt-12">
          <MoreEpisodes episodes={moreEpisodes} />
        </div>
      )}

      {/* Subscribe CTA */}
      <SubscribeCTA />
    </div>
  );
}
