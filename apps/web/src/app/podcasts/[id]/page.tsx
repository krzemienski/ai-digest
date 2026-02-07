import { db, queries } from "@ai-digest/db";
import { Container } from "@/components/layout/container";
import { EpisodePlayerLoader } from "@/components/podcast/episode-player-loader";
import type { Episode, TranscriptSegment } from "@ai-digest/shared";

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await queries.getEpisodeWithTranscript(db, id);

  if (!result) {
    return (
      <Container className="py-8">
        <div className="text-center py-16">
          <h1 className="font-mono text-cyber-magenta text-2xl mb-4">
            Episode Not Found
          </h1>
          <p className="font-sans text-cyber-text-secondary">
            The requested episode does not exist or has been removed.
          </p>
        </div>
      </Container>
    );
  }

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

  const transcriptSegments: TranscriptSegment[] | null =
    result.transcript?.segments ?? null;

  return (
    <Container className="py-8">
      <EpisodePlayerLoader episode={episode} transcript={transcriptSegments} />
    </Container>
  );
}
