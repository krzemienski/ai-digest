/** A single dialogue segment in a podcast script. */
export interface ScriptSegment {
  /** Sequence number for ordering */
  order: number;
  /** Speaker identifier (e.g., "Host A", "Host B") */
  speaker: string;
  /** Dialogue text to be spoken */
  text: string;
  /** Estimated duration in seconds */
  estimatedDuration: number;
}

/**
 * Parse and normalize a podcast script from Claude's JSON output.
 *
 * Handles various output formats including wrapped JSON code blocks and trailing text.
 * Validates required fields and auto-fills missing order/duration estimates.
 *
 * @param rawScript - Raw script output from LLM (may include markdown code blocks)
 * @returns Normalized and sorted array of script segments
 * @throws {Error} When JSON parsing fails
 */
export function parseScript(rawScript: string): ScriptSegment[] {
  // Parse JSON output from Claude — may be wrapped in ```json blocks
  // and may have trailing explanatory text after the JSON
  let cleaned = rawScript.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Extract JSON object/array: find the first { or [ and its matching close
  const jsonStart = cleaned.search(/[\[{]/);
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }
  const opener = cleaned[0];
  const closer = opener === "[" ? "]" : "}";
  const lastClose = cleaned.lastIndexOf(closer);
  if (lastClose > 0) {
    cleaned = cleaned.slice(0, lastClose + 1);
  }

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

/**
 * Calculate total estimated duration of a script.
 *
 * @param segments - Array of script segments
 * @returns Total duration in seconds
 */
export function estimateTotalDuration(segments: ScriptSegment[]): number {
  let total = 0;
  for (const seg of segments) {
    total = total + seg.estimatedDuration;
  }
  return total;
}

/**
 * Validate script segments for required fields and basic quality checks.
 *
 * Checks for non-empty segments, at least 2 speakers, and valid durations.
 *
 * @param segments - Array of script segments to validate
 * @returns Validation result with error messages if invalid
 */
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
