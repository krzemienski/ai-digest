import { z } from "zod";

export const SynthesizeResultSchema = z.object({
  synthesis: z.string(),
  topTopics: z.array(z.string()),
  itemCount: z.number(),
});

export type SynthesizeSchemaOutput = z.infer<typeof SynthesizeResultSchema>;
