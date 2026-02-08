# ElevenLabs API Deep Research

> Research conducted 2026-02-07 for the AI Digest podcast generation pipeline.

---

## Table of Contents

1. [Models & Selection](#1-models--selection)
2. [Voice Selection & Configuration](#2-voice-selection--configuration)
3. [Cross-Segment Voice Continuity](#3-cross-segment-voice-continuity)
4. [Pricing & Quotas](#4-pricing--quotas)
5. [Audio Quality Optimization](#5-audio-quality-optimization)
6. [Multi-Speaker Podcast Pattern](#6-multi-speaker-podcast-pattern)
7. [ffmpeg Assembly Best Practices](#7-ffmpeg-assembly-best-practices)
8. [Error Handling & Resilience](#8-error-handling--resilience)
9. [Implementation Recommendations](#9-implementation-recommendations)

---

## 1. Models & Selection

### Available Models

| Model ID | Quality | Latency | Languages | Max Chars | Credit Cost | Best For |
|----------|---------|---------|-----------|-----------|-------------|----------|
| `eleven_v3` | Highest expressiveness | Standard | 70+ | 5,000 (~5 min) | 1 char = 1 credit | Emotional dialogue, audiobooks, dramatic delivery |
| `eleven_multilingual_v2` | Highest consistency | Higher | 29 | 10,000 (~10 min) | 1 char = 1 credit | Professional voiceovers, consistent narration |
| `eleven_turbo_v2_5` | High quality | ~250-300ms | 32 | 40,000 (~40 min) | 1 char = 0.5 credit | Balanced quality/speed, prototyping |
| `eleven_flash_v2_5` | Good (lower emotional depth) | ~75ms | 32 | 40,000 (~40 min) | 1 char = 0.5 credit | Real-time agents, bulk processing |
| `eleven_turbo_v2` | Good | ~250-300ms | English only | - | 0.5 credit | English-only balanced |
| `eleven_flash_v2` | Good | ~75ms | English only | - | 0.5 credit | English-only real-time |

### Recommendation for AI Digest Podcast

**Primary choice: `eleven_multilingual_v2`** (current implementation is correct)

Rationale:
- Podcast is pre-generated daily (not real-time), so latency is irrelevant
- Highest quality and most consistent voice synthesis
- Best emotional range for engaging podcast narration
- 10,000 char limit per request is sufficient for individual segments
- Supports 29 languages if future internationalization is needed

**Alternative: `eleven_v3`** for even more expressive delivery

If the podcast style benefits from dramatic, highly expressive speech:
- `eleven_v3` offers the most human-like, emotionally nuanced speech
- Supports audio tags for non-speech events: `[laughs]`, `[sighs]`, `[whispers]`
- However, limited to 5,000 chars per request (need shorter segments)
- Does NOT support SSML break tags (pauses via punctuation only)
- Required for the Text-to-Dialogue API

**Cost-saving alternative: `eleven_turbo_v2_5`**

For budget-conscious operation:
- Half the credit cost (0.5 credits per character vs 1.0)
- 40,000 char limit per request (can send larger segments)
- Still good quality, just slightly less expressive than v2

---

## 2. Voice Selection & Configuration

### Recommended Pre-Made Voices for Podcast

All 45 pre-made voices are available to all users. Here are the best candidates for a two-host AI news podcast:

#### Host Voice (Primary narrator - authoritative, clear)

| Voice | ID | Gender | Style | Why |
|-------|----|--------|-------|-----|
| **Josh** | `TxGEqnHWrfWFTfGW9XjX` | Male | Deep, authoritative | Documentary-style clarity, strong narration |
| **Adam** | `pNInz6obpgDQGcFmaJgB` | Male | Clear, engaging | Popular for podcasts and audiobooks |
| **Brian** | `nPczCjzI2devNBz1zQrb` | Male | Warm, professional | Natural podcast host quality |
| **Daniel** | `onwK4e9ZLuTAKqWW03F9` | Male | Authoritative | News-reading style |
| **Chris** | `iP95p4xoKVk53GoZ742B` | Male | Conversational | Casual tech podcast tone |

#### Co-Host Voice (Complementary - conversational, warm)

| Voice | ID | Gender | Style | Why |
|-------|----|--------|-------|-----|
| **Rachel** | `21m00Tcm4TlvDq8ikWAM` | Female | Calm, composed | Excellent narration quality |
| **Sarah** | `EXAVITQu4vr4xnSDxMaL` | Female | Soft, warm | Engaging podcast co-host |
| **Charlotte** | `XB0fDUnXU5powFXDhCwa` | Female | Professional | Clear and articulate |
| **Matilda** | `XrExE9yKIg1WjnnlVkGX` | Female | Warm, friendly | Accessible and engaging |
| **Lily** | `pFZP5JQG7iQjIQuC4Bku` | Female | Expressive | Dynamic co-host energy |

#### Recommended Pairing

**Best male/female pair:** `Brian` (host) + `Sarah` (co-host)
- Distinct tonal qualities that complement each other
- Both well-suited for long-form content
- Natural contrast in voice character

**Best male/male pair:** `Josh` (host) + `Chris` (co-host)
- Josh provides gravitas; Chris brings conversational warmth
- Clear distinction between voices

### Voice Settings Deep Dive

Each setting ranges from 0.0 to 1.0 (unless noted otherwise):

| Setting | Parameter | Range | Effect |
|---------|-----------|-------|--------|
| **Stability** | `stability` | 0.0 - 1.0 | Controls variation between generations. Lower = more expressive but less consistent. Higher = more monotone but predictable. |
| **Similarity Boost** | `similarity_boost` | 0.0 - 1.0 | How closely output matches the original voice. Higher = more faithful to voice character but may amplify artifacts. |
| **Style** | `style` | 0.0 - 1.0 | Amplifies the style of the original speaker. Higher = more stylized. Increases latency and compute. Recommended: keep at 0 unless needed. |
| **Speed** | `speed` | 0.7 - 1.2 | Speech rate multiplier. Default 1.0. Extreme values degrade quality. |
| **Speaker Boost** | `use_speaker_boost` | boolean | Boosts similarity to original speaker. Increases latency. Not available for Eleven v3. |

#### Optimal Settings for Podcast

```typescript
// HOST voice settings - authoritative, consistent
const hostSettings = {
  stability: 0.70,        // Consistent narration, slight expressiveness
  similarityBoost: 0.75,  // Strong voice identity
  style: 0.30,            // Moderate natural expression
  speed: 1.0,             // Normal pacing
};

// CO-HOST voice settings - slightly more expressive
const coHostSettings = {
  stability: 0.60,        // More expressive for reactions/commentary
  similarityBoost: 0.70,  // Good voice identity
  style: 0.40,            // Slightly more stylized for energy
  speed: 1.0,             // Normal pacing
};
```

**Key guidance:**
- Stability 0.6-0.8 ensures consistent narration across long content
- Similarity 0.7-0.75 maintains strong voice identity across segments
- Style 0.3-0.5 adds natural engagement without being overwhelming
- Keep speed at 1.0 for podcasts; listeners control playback speed themselves

---

## 3. Cross-Segment Voice Continuity

### Request Stitching System

ElevenLabs provides two mechanisms for maintaining prosody continuity across segmented generation:

#### Mechanism 1: `previous_request_ids` / `next_request_ids` (Preferred)

Pass actual API request IDs from prior/future generations:

```typescript
// Parameters
previous_request_ids: string[]  // Max 3 IDs
next_request_ids: string[]      // Max 3 IDs
```

**How it works:**
- The model conditions its generation on the audio characteristics of referenced requests
- Maintains consistent prosody, pacing, and emotional tone across segments
- Most effective when the same model is used across all generations

**Constraints:**
- Maximum of 3 request IDs per parameter
- Must use the same model across all referenced generations
- If both `previous_text` and `previous_request_ids` are sent, `previous_text` is IGNORED

**Getting the request ID:**

The API returns the request ID in the `request-id` response header. In the current JS SDK (`elevenlabs` package), the `textToSpeech.convert()` method returns a `ReadableStream<Uint8Array>` which does not directly expose headers.

**Workaround for request ID extraction:** Use the raw HTTP API directly or use `fetch` to call the endpoint and extract headers:

```typescript
// Option A: Direct fetch to get request-id header
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: segment.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.7, similarity_boost: 0.75, style: 0.3 },
      previous_request_ids: previousIds.slice(-3),
    }),
  }
);
const requestId = response.headers.get("request-id");
const audioBuffer = Buffer.from(await response.arrayBuffer());
```

#### Mechanism 2: `previous_text` / `next_text` (Fallback)

Pass the raw text of neighboring segments as context:

```typescript
// Parameters
previous_text: string  // Text from previous segment(s)
next_text: string      // Text from next segment(s)
```

**How it works:**
- The model uses the text context to predict appropriate prosody
- Simpler to implement (no request ID tracking needed)
- Less accurate than request ID approach since it lacks actual audio reference

**When to use:**
- First generation (no previous request IDs yet)
- When regenerating a segment and you want new audio with context awareness
- Fallback if request ID tracking fails

#### Precedence Rules

| Combination | Behavior |
|-------------|----------|
| `previous_request_ids` + `previous_text` | `previous_text` is IGNORED |
| `next_request_ids` + `next_text` | `next_text` is IGNORED |
| Only `previous_text` | Text-based continuity used |
| Only `previous_request_ids` | Audio-reference continuity used |
| Neither | No continuity conditioning |

### Current Implementation Issues

The current `tts.ts` uses `previous_request_ids` but generates synthetic IDs (`seg-${segment.order}-${Date.now()}`) instead of actual API response request IDs. This means the continuity feature is **not actually working**. The fix requires extracting real `request-id` headers from API responses.

---

## 4. Pricing & Quotas

### Plan Comparison (as of 2026)

| Plan | Monthly Cost | Credits | TTS Minutes | Concurrent Requests | Voice Cloning | Commercial License |
|------|-------------|---------|-------------|--------------------|--------------|--------------------|
| **Free** | $0 | 10,000 | ~10 min | 2 | None | No |
| **Starter** | $5 | 30,000 | ~30 min | 3 | Instant only | Yes |
| **Creator** | $22 | 100,000 | ~100 min | 5 | Instant + Professional | Yes |
| **Pro** | $99 | 500,000 | ~500 min | 10 | Instant + Professional | Yes |
| **Scale** | $330 | 2,000,000 | ~2,000 min | 15 | Inst + Pro (3 slots) | Yes |
| **Business** | $1,320 | 11,000,000 | ~11,000 min | 15 | Full suite | Yes |
| **Enterprise** | Custom | Custom | Custom | Custom | Full suite | Yes |

### Audio Format Availability by Tier

| Format | Free/Starter | Creator+ | Pro+ |
|--------|-------------|----------|------|
| MP3 128kbps | Yes | Yes | Yes |
| MP3 192kbps | No | Yes | Yes |
| PCM 22.05kHz | Yes | Yes | Yes |
| PCM 44.1kHz | No | No | Yes |

### Overage Pricing (per 1,000 characters)

| Plan | Overage Cost |
|------|-------------|
| Creator | $0.30 |
| Pro | $0.24 |
| Scale | $0.18 |
| Business | Lower (custom) |

### Cost Estimation for AI Digest Daily Podcast

**Assumptions:**
- Target duration: 10 minutes per episode
- Average speaking rate: ~150 words/minute = ~2,000 characters/minute
- 10-minute podcast = ~20,000 characters
- Daily generation (30 episodes/month)

**Monthly character usage: ~600,000 characters**

| Model | Credits/Month | Best Plan | Monthly Cost |
|-------|--------------|-----------|-------------|
| `eleven_multilingual_v2` (1 credit/char) | 600,000 | Pro ($99, 500K) + overage | ~$99 + $24 overage = **~$123/mo** |
| `eleven_multilingual_v2` (1 credit/char) | 600,000 | Scale ($330, 2M) | **$330/mo** (no overage) |
| `eleven_turbo_v2_5` (0.5 credit/char) | 300,000 | Pro ($99, 500K) | **$99/mo** (within limit) |
| `eleven_turbo_v2_5` (0.5 credit/char) | 300,000 | Creator ($22, 100K) + overage | ~$22 + $60 overage = **~$82/mo** |

**Recommendation:**
- **Pro plan ($99/mo) with `eleven_turbo_v2_5`** for budget optimization (still high quality)
- **Pro plan ($99/mo) with `eleven_multilingual_v2`** for maximum quality (slight overage some months)
- Scale plan only if adding more content types or longer episodes

---

## 5. Audio Quality Optimization

### Output Format Selection

For podcast production, use the highest quality MP3 format available on your plan:

```typescript
// Recommended output formats by plan
const outputFormat = {
  creator: "mp3_44100_128",   // 44.1kHz, 128kbps (good quality)
  pro: "mp3_44100_192",       // 44.1kHz, 192kbps (best MP3 quality)
  budgetPro: "mp3_44100_128", // 44.1kHz, 128kbps (save on file size)
};
```

**Format string pattern:** `codec_sampleRate_bitrate`

| Format String | Codec | Sample Rate | Bitrate | Notes |
|--------------|-------|-------------|---------|-------|
| `mp3_44100_128` | MP3 | 44.1kHz | 128kbps | Standard podcast quality |
| `mp3_44100_192` | MP3 | 44.1kHz | 192kbps | High quality (Creator+ only) |
| `pcm_44100` | PCM | 44.1kHz | Uncompressed | Best for post-processing (Pro+ only) |
| `pcm_24000` | PCM | 24kHz | Uncompressed | Good quality, smaller files |

**Recommendation:** Generate in `mp3_44100_128` for the segment files. The final assembly via ffmpeg can apply additional processing. If on Pro+ tier, generating in `pcm_44100` and letting ffmpeg handle the final MP3 encode gives maximum quality control.

### Pronunciation Control for Technical Terms

ElevenLabs does NOT support full SSML. However, it supports specific tags:

#### SSML Phoneme Tags (v2 Flash, v2 Turbo, English v1 ONLY)

```xml
<!-- CMU Arpabet (recommended for consistency) -->
<phoneme alphabet="cmu-arpabet" ph="JH IY P IY T IY">GPT</phoneme>

<!-- IPA format -->
<phoneme alphabet="ipa" ph="d͡ʒiː piː tiː">GPT</phoneme>
```

**Important:** Phoneme tags do NOT work with `eleven_multilingual_v2` or `eleven_v3`.

#### Pronunciation Dictionaries

For `eleven_multilingual_v2`, use pronunciation dictionaries instead:
- Create a dictionary via the API with word-to-pronunciation mappings
- Pass `pronunciation_dictionary_locators` in the TTS request
- Supports PLS (XML) or TXT format
- Case-sensitive matching; first match wins

#### Text-Based Pronunciation Hints

For all models, use text formatting tricks:

```
// Spell out acronyms for clarity
"GPT" → "G P T"
"LLM" → "L L M"
"API" → "A P I"
"CUDA" → "KOODA"
"GAN" → "gan" (lowercase for natural pronunciation)
"PyTorch" → "Pie-Torch"
"DALL-E" → "Dolly"
```

### Pause Control

#### For `eleven_multilingual_v2` (current model):

```xml
<!-- SSML break tag (up to 3 seconds) -->
<break time="1.5s" />

<!-- Use sparingly — too many breaks can cause speech speedup artifacts -->
```

#### Alternative pause methods (all models):

```
Em-dash for short pause: "The results were surprising — far beyond expectations."
Double dash for longer pause: "Let me explain -- -- how this works."
Ellipsis for hesitant/thoughtful pause: "Well... that's an interesting question."
New paragraph for natural break: Split into separate sentences.
```

**Warning:** Excessive SSML `<break>` tags in a single generation can cause the AI to speed up or introduce noise artifacts. Limit to 3-4 per segment.

### Text Normalization

The API supports automatic text normalization via `apply_text_normalization`:

| Value | Behavior |
|-------|----------|
| `auto` (default) | Model decides normalization |
| `on` | Force normalization (numbers, dates, abbreviations expanded) |
| `off` | No normalization (read text exactly as written) |

**Recommendation for podcast:** Use `auto` and pre-process the script text with an LLM to expand technical terms, numbers, and abbreviations before sending to TTS.

---

## 6. Multi-Speaker Podcast Pattern

### Approach A: Sequential TTS per Segment (Current Implementation)

Generate each speaker's lines individually with their respective voice ID, then concatenate with ffmpeg.

```
Segment 1 (Host, voice_id=Brian) → audio_001.mp3
Segment 2 (CoHost, voice_id=Sarah) → audio_002.mp3
Segment 3 (Host, voice_id=Brian) → audio_003.mp3
...
ffmpeg concat → final_episode.mp3
```

**Pros:**
- Full control over each segment's voice settings
- Can use any model (v2, turbo, flash)
- Request stitching via `previous_request_ids` maintains continuity per speaker
- Easy to retry/regenerate individual segments
- Works with current implementation architecture

**Cons:**
- Must manage turn-taking gaps manually (silence between speakers)
- No cross-speaker prosody conditioning (speakers don't "react" to each other)
- Sequential processing (one segment at a time for continuity)

### Approach B: Text-to-Dialogue API (Eleven v3 Only)

Single API call generates the entire dialogue with multiple speakers.

```typescript
// POST /v1/text-to-dialogue
const response = await fetch("https://api.elevenlabs.io/v1/text-to-dialogue", {
  method: "POST",
  headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
  body: JSON.stringify({
    model_id: "eleven_v3",
    inputs: [
      { text: "Welcome back to AI Digest!", voice_id: "nPczCjzI2devNBz1zQrb" },
      { text: "Today we have some exciting news.", voice_id: "EXAVITQu4vr4xnSDxMaL" },
      { text: "Let's dive into the top stories.", voice_id: "nPczCjzI2devNBz1zQrb" },
    ],
    settings: { stability: 0.65 },
    output_format: "mp3_44100_128",
  }),
});
```

**Pros:**
- Natural cross-speaker prosody (speakers sound like they're in a conversation)
- Single API call for entire episode
- Supports audio tags for expressiveness: `[laughs]`, `[excited]`
- Up to 10 unique voices per dialogue

**Cons:**
- Only available with `eleven_v3` model
- 5,000 character limit per request (need to split long podcasts into chunks)
- Less control over individual segment quality
- Nondeterministic (may need multiple generations to get desired quality)
- No `previous_request_ids` equivalent for cross-chunk continuity

### Recommended Approach for AI Digest

**Use Approach A (Sequential TTS)** with the following enhancements:

1. **Use `eleven_multilingual_v2`** for highest quality per-segment generation
2. **Extract real `request-id` headers** to enable actual cross-segment continuity
3. **Add 300-500ms silence gaps** between speaker turns during ffmpeg assembly
4. **Pre-process script text** with an LLM to add natural-sounding transitions

**Future consideration:** If `eleven_v3` adds longer character limits or chunk stitching support, revisit Approach B for more natural dialogues.

### Silence Gaps Between Speakers

For natural-sounding speaker transitions:

| Transition Type | Silence Duration | When |
|----------------|-----------------|------|
| Same speaker continues | 0ms | Continuation of thought |
| Speaker change (agreement) | 200-300ms | "Right, and..." |
| Speaker change (new topic) | 400-600ms | "Now let's move to..." |
| Speaker change (emphasis) | 600-800ms | After a dramatic statement |
| Section transition | 800-1200ms | Moving to a new topic segment |

---

## 7. ffmpeg Assembly Best Practices

### Current Implementation Analysis

The current `assembler.ts` uses:
- Concat demuxer (`-f concat -safe 0`) -- correct approach
- `libmp3lame` codec at 128kbps -- good
- 44.1kHz stereo output -- standard

### Recommended Improvements

#### 1. Loudness Normalization (EBU R128)

Podcasts should target **-16 LUFS** (Apple Podcasts, Spotify recommendation).

**Two-pass approach:**

```bash
# Pass 1: Measure loudness
ffmpeg -i input.mp3 -af loudnorm=I=-16:LRA=11:TP=-1.5:print_format=json -f null /dev/null

# Pass 2: Apply normalization with measured values
ffmpeg -i input.mp3 -af loudnorm=I=-16:LRA=11:TP=-1.5:measured_I=-23.5:measured_LRA=7.0:measured_TP=-0.5:measured_thresh=-34.0:linear=true -ar 44100 -b:a 128k output.mp3
```

**Parameters explained:**
| Parameter | Value | Meaning |
|-----------|-------|---------|
| `I` | -16 | Target integrated loudness (LUFS) |
| `LRA` | 11 | Loudness range target (dB) |
| `TP` | -1.5 | True peak limit (dBFS) - prevents clipping |
| `linear` | true | Use linear normalization (preserves dynamics) |

#### 2. Silence Padding Between Segments

Insert configurable silence between speaker turns:

```bash
# Generate silence file
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -q:a 9 silence_400ms.mp3

# Include in concat list between speaker transitions
# file 'seg-0001.mp3'
# file 'silence_400ms.mp3'  <-- insert between different speakers
# file 'seg-0002.mp3'
```

#### 3. Audio Crossfade (Optional)

For smoother transitions between segments of the same speaker:

```bash
# Using acrossfade filter (for 2 inputs)
ffmpeg -i seg1.mp3 -i seg2.mp3 -filter_complex "acrossfade=d=0.1:c1=tri:c2=tri" output.mp3
```

Note: Crossfade adds complexity with many segments. For podcast, simple concatenation with silence gaps is usually sufficient.

#### 4. ID3 Metadata Tags

Add podcast metadata to the final MP3:

```bash
ffmpeg -i input.mp3 \
  -metadata title="AI Digest - February 7, 2026" \
  -metadata artist="AI Digest" \
  -metadata album="AI Digest Podcast" \
  -metadata genre="Technology" \
  -metadata date="2026-02-07" \
  -metadata comment="Daily AI news digest" \
  -c:a copy output.mp3
```

#### 5. Complete Recommended ffmpeg Pipeline

```bash
# Step 1: Concat all segments with silence gaps
ffmpeg -f concat -safe 0 -i concat.txt -c copy concatenated.mp3

# Step 2: Loudness normalization (two-pass)
# Pass 1: Measure
ffmpeg -i concatenated.mp3 -af loudnorm=I=-16:LRA=11:TP=-1.5:print_format=json -f null /dev/null 2>&1

# Pass 2: Normalize + add metadata
ffmpeg -i concatenated.mp3 \
  -af "loudnorm=I=-16:LRA=11:TP=-1.5:measured_I=MEASURED:measured_LRA=MEASURED:measured_TP=MEASURED:measured_thresh=MEASURED:linear=true" \
  -ar 44100 \
  -b:a 128k \
  -ac 1 \
  -metadata title="AI Digest - YYYY-MM-DD" \
  -metadata artist="AI Digest" \
  -metadata album="AI Digest Daily Podcast" \
  -metadata genre="Technology" \
  output.mp3
```

**Note on channels:** Consider `-ac 1` (mono) for podcast. Voice-only content does not benefit from stereo, and mono halves the file size. Most podcast platforms recommend mono for speech content.

#### 6. Encoding Quality Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| Codec | libmp3lame | Universal compatibility |
| Bitrate | 128kbps (stereo) or 64kbps (mono) | Podcast standard |
| Sample Rate | 44100 Hz | Standard audio quality |
| Channels | 1 (mono) | Speech content, smaller files |
| Loudness | -16 LUFS | Apple/Spotify standard |
| True Peak | -1.5 dBFS | Prevents clipping on decode |

---

## 8. Error Handling & Resilience

### API Error Codes

| HTTP Code | Type | Cause | Handling |
|-----------|------|-------|----------|
| **400** | Bad Request | Invalid parameters, malformed body | Check params, validate before sending |
| **401** | Unauthorized | Invalid or missing API key | Verify `ELEVENLABS_API_KEY` env var |
| **422** | Unprocessable Entity | CORS issues, invalid JSON body | Ensure `JSON.stringify()` on body |
| **429** `too_many_concurrent_requests` | Rate Limit | Exceeded concurrent request limit | Queue requests, respect concurrency |
| **429** `system_busy` | Rate Limit | ElevenLabs under high load | Retry with exponential backoff |
| **500** | Server Error | ElevenLabs internal error | Retry with exponential backoff |

### Concurrent Request Limits by Plan

| Plan | Max Concurrent |
|------|---------------|
| Free | 2 |
| Starter | 3 |
| Creator | 5 |
| Pro | 10 |
| Scale | 15 |
| Business | 15 |

### Recommended Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: 3;
  baseDelayMs: 1000;
  maxDelayMs: 30000;
  backoffMultiplier: 2;
  retryableStatusCodes: [429, 500, 502, 503, 504];
}

// Exponential backoff with jitter
function getRetryDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = cappedDelay * (0.5 + Math.random() * 0.5); // 50-100% of delay
  return Math.round(jitter);
}
```

### Partial Generation Recovery

The sequential segment approach naturally supports partial recovery:

```typescript
// Track completed segments
const completedSegments: TTSResult[] = [];

for (const segment of segments) {
  try {
    const result = await generateWithRetry(segment, retryConfig);
    completedSegments.push(result);
  } catch (error) {
    // Log which segment failed
    console.error(`Segment ${segment.order} failed after all retries:`, error);

    // Option 1: Fail the entire episode
    throw new Error(`Episode generation failed at segment ${segment.order}/${segments.length}`);

    // Option 2: Skip failed segment and note gap (not recommended)
    // completedSegments.push(createSilenceSegment(segment.order, segment.estimatedDuration));
  }
}
```

### Rate Limit Queuing

For plans with low concurrency limits, implement a request queue:

```typescript
// Use a semaphore/concurrency limiter
// Max concurrent = plan's limit minus 1 (safety margin)
const CONCURRENCY_LIMIT = 9; // Pro plan = 10, minus safety margin

// Process segments with concurrency control
// Note: For cross-segment continuity, sequential processing is required anyway
// But if generating segments for multiple episodes in parallel, use a queue
```

---

## 9. Implementation Recommendations

### Critical Fixes for Current Code

#### Fix 1: Extract Real Request IDs

The current code generates fake request IDs. Fix by using direct HTTP calls:

```typescript
// In tts.ts - use fetch instead of SDK for request-id access
async function generateSegmentAudio(
  segment: ScriptSegment,
  voiceId: string,
  voiceSettings: VoiceSettings,
  previousRequestIds: string[]
): Promise<TTSResult> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: segment.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarityBoost,
          style: voiceSettings.style,
        },
        previous_request_ids: previousRequestIds.slice(-3),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
  }

  const requestId = response.headers.get("request-id") ?? `fallback-${Date.now()}`;
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const estimatedDurationMs = Math.round((audioBuffer.length / 16000) * 1000);

  return { order: segment.order, speaker: segment.speaker, audioBuffer, requestId, durationMs: estimatedDurationMs };
}
```

#### Fix 2: Add Retry Logic

Wrap the API call with exponential backoff for resilience.

#### Fix 3: Add `output_format` Parameter

Currently not specifying output_format (relies on default `mp3_44100_128`). Explicitly set it.

#### Fix 4: Add Silence Gaps in Assembler

Insert silence between speaker transitions during ffmpeg concatenation.

#### Fix 5: Add Loudness Normalization

Add a two-pass EBU R128 normalization step to the ffmpeg pipeline.

#### Fix 6: Add ID3 Metadata

Tag the final MP3 with episode title, date, and podcast metadata.

### Recommended Voice Configuration

```typescript
// Default voice config for AI Digest podcast
const defaultVoiceConfig: VoiceConfig = {
  speakers: [
    {
      role: "host",
      voiceId: "nPczCjzI2devNBz1zQrb",  // Brian - warm, professional
      settings: {
        stability: 0.70,
        similarityBoost: 0.75,
        speed: 1.0,
        style: 0.30,
      },
    },
    {
      role: "cohost",
      voiceId: "EXAVITQu4vr4xnSDxMaL",  // Sarah - soft, engaging
      settings: {
        stability: 0.60,
        similarityBoost: 0.70,
        speed: 1.0,
        style: 0.40,
      },
    },
  ],
  audioFormat: "mp3_44100_128",
  targetDurationMinutes: 10,
};
```

### SDK Package Note

The project currently uses `"elevenlabs": "^1.0.0"` in `packages/podcast/package.json`. The official package is now `@elevenlabs/elevenlabs-js`. Consider either:
1. Keeping `elevenlabs` (community package, simpler API) if it still works
2. Migrating to `@elevenlabs/elevenlabs-js` (official SDK) for latest features
3. Using raw `fetch` for the TTS endpoint to control headers (recommended for request-id extraction)

---

## Sources

- [ElevenLabs Models Documentation](https://elevenlabs.io/docs/overview/models)
- [Text-to-Speech API Reference](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)
- [Request Stitching Guide](https://elevenlabs.io/docs/developers/guides/cookbooks/text-to-speech/request-stitching)
- [TTS Best Practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)
- [Voice Settings Documentation](https://elevenlabs.io/docs/api-reference/voices/settings/get)
- [Text-to-Dialogue API](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)
- [Error Messages Reference](https://elevenlabs.io/docs/developers/resources/error-messages)
- [API Rate Limits](https://help.elevenlabs.io/hc/en-us/articles/14312733311761)
- [Premade Voices List](https://elevenlabs-sdk.mintlify.app/voices/premade-voices)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing/api)
- [ElevenLabs JS SDK](https://github.com/elevenlabs/elevenlabs-js)
- [ElevenLabs Pricing Breakdown 2026](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- [ffmpeg Loudness Normalization](https://github.com/slhck/ffmpeg-normalize)
- [Audio Loudness Normalization with FFmpeg](https://medium.com/@peter_forgacs/audio-loudness-normalization-with-ffmpeg-1ce7f8567053)
- [ElevenLabs Voice Library - Podcast](https://elevenlabs.io/voice-library/podcast)
- [ElevenLabs Meet Flash](https://elevenlabs.io/blog/meet-flash)
- [ElevenLabs Request Stitching Blog](https://elevenlabs.io/blog/request-stitching-for-text-to-speech-api)
- [ElevenLabs Audio Format Support](https://help.elevenlabs.io/hc/en-us/articles/15754340124305)
- [ElevenLabs Error Code 429](https://help.elevenlabs.io/hc/en-us/articles/19571824571921)
- [ElevenLabs Pauses and SSML](https://help.elevenlabs.io/hc/en-us/articles/24352686926609)
- [ElevenLabs Pronunciation Control](https://help.elevenlabs.io/hc/en-us/articles/16712320194577)
- [ElevenLabs v3 Audio Tags](https://elevenlabs.io/blog/eleven-v3-audio-tags-bringing-multi-character-dialogue-to-life)
