import { z } from "zod";

export const ScoreResultSchema = z.object({
  results: z.array(
    z.object({
      itemId: z.string(),
      relevanceScore: z.number(),
      noveltyScore: z.number(),
      impactScore: z.number(),
    })
  ),
});

export type ScoreSchemaOutput = z.infer<typeof ScoreResultSchema>;
