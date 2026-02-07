export interface Episode {
  id: string;
  digestId: string;
  title: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  audioFormat: string;
  status: "pending" | "generating" | "ready" | "failed";
  createdAt: string;
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface Transcript {
  id: string;
  episodeId: string;
  segments: TranscriptSegment[];
  fullText: string;
}
