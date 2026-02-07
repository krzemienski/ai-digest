export interface ScriptSegment {
  order: number;
  speaker: string;
  text: string;
  estimatedDuration: number;
}

export function parseScript(rawScript: string): ScriptSegment[] {
  // Parse JSON output from Claude — may be wrapped in ```json blocks
  const cleaned = rawScript.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned) as { segments: ScriptSegment[] } | ScriptSegment[];

  const segments = Array.isArray(parsed) ? parsed : parsed.segments;

  // Validate and normalize
  const validated = segments.map((seg, idx) => ({
    order: seg.order ?? idx + 1,
    speaker: seg.speaker,
    text: seg.text.trim(),
    estimatedDuration: seg.estimatedDuration ?? Math.ceil(seg.text.split(/\s+/).length / 2.5), // ~150 wpm = 2.5 wps
  }));

  // Sort by order
  const sorted = [...validated].sort((a, b) => a.order - b.order);

  return sorted;
}

export function estimateTotalDuration(segments: ScriptSegment[]): number {
  let total = 0;
  for (const seg of segments) {
    total = total + seg.estimatedDuration;
  }
  return total;
}

export function validateSegments(segments: ScriptSegment[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (segments.length === 0) {
    errors.push("No segments found");
  }

  const speakers = new Set(segments.map(s => s.speaker));
  if (speakers.size < 2) {
    errors.push("Expected at least 2 speakers, found: " + [...speakers].join(", "));
  }

  for (const seg of segments) {
    if (!seg.text || seg.text.length === 0) {
      errors.push(`Segment ${seg.order}: empty text`);
    }
    if (seg.estimatedDuration <= 0) {
      errors.push(`Segment ${seg.order}: invalid duration ${seg.estimatedDuration}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
