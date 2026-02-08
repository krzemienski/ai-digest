import { z } from "zod";

export const CategorizeResultSchema = z.object({
  results: z.array(
    z.object({
      itemId: z.string(),
      topics: z.array(z.string()),
    })
  ),
});

export type CategorizeSchemaOutput = z.infer<typeof CategorizeResultSchema>;
