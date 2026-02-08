import { z } from "zod";

export const DedupResultSchema = z.object({
  results: z.array(
    z.object({
      duplicateId: z.string(),
      originalId: z.string(),
      confidence: z.number(),
    })
  ),
});

export type DedupSchemaOutput = z.infer<typeof DedupResultSchema>;
