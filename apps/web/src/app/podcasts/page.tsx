import { db, queries } from "@ai-digest/db";
import { Container } from "@/components/layout/container";
import { EpisodeCard } from "@/components/podcast/episode-card";

export const dynamic = "force-dynamic";

export default async function PodcastsPage() {
  const episodes = await queries.getEpisodes(db, { limit: 50 });

  return (
    <Container className="py-8">
      <h1 className="text-accent text-2xl mb-8">
        Podcast Episodes
      </h1>

      {episodes.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-sans text-text-secondary text-lg">
            No episodes yet. Run the pipeline to generate your first podcast.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {episodes.map((ep) => (
            <EpisodeCard
              key={ep.id}
              episode={{
                id: ep.id,
                title: ep.title,
                audioUrl: ep.audioUrl,
                durationSeconds: ep.durationSeconds,
                status: ep.status,
                createdAt: String(ep.createdAt),
                digestId: ep.digestId,
                audioFormat: ep.audioFormat ?? "mp3_44100_128",
              }}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
