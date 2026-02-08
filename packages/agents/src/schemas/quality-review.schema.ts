import { z } from "zod";

export const QualityReviewSchema = z.object({
  overallScore: z.number(),
  naturalness: z.number(),
  coverage: z.number(),
  accuracy: z.number(),
  engagement: z.number(),
  pacing: z.number(),
  transitions: z.number(),
  passed: z.boolean(),
  feedback: z.string(),
  segmentsToRevise: z.array(
    z.object({
      segmentOrder: z.number(),
      issue: z.string(),
      suggestion: z.string(),
    })
  ),
});

export type QualityReviewOutput = z.infer<typeof QualityReviewSchema>;
