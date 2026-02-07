import { createHash } from "crypto";

export function deterministicId(source: string, sourceId: string): string {
  return createHash("sha256").update(`${source}:${sourceId}`).digest("hex").slice(0, 32);
}
