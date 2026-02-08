import { z } from "zod";

export const PodcastScriptSchema = z.object({
  metadata: z.object({
    episodeDate: z.string(),
    totalEstimatedDuration: z.number(),
    topicsCovered: z.array(z.string()),
    storyCount: z.number(),
  }),
  segments: z.array(
    z.object({
      order: z.number(),
      speaker: z.enum(["Host A", "Host B"]),
      text: z.string(),
      estimatedDuration: z.number(),
      segmentType: z.enum(["intro", "topic", "transition", "reaction", "outro"]),
      relatedStoryTitles: z.array(z.string()),
      emotion: z.enum(["neutral", "excited", "thoughtful", "surprised", "concerned", "humorous"]),
    })
  ),
});

export type PodcastScriptOutput = z.infer<typeof PodcastScriptSchema>;
