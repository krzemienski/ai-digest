---
title: "Podcast Pipeline Transparency Dashboard"
status: draft
version: "1.0"
---

# Product Requirements Document

## Validation Checklist

### CRITICAL GATES (Must Pass)

- [x] All required sections are complete
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Problem statement is specific and measurable
- [x] Every feature has testable acceptance criteria (Gherkin format)
- [x] No contradictions between sections

### QUALITY CHECKS (Should Pass)

- [x] Problem is validated by evidence (not assumptions)
- [x] Context -> Problem -> Solution flow makes sense
- [x] Every persona has at least one user journey
- [x] All MoSCoW categories addressed (Must/Should/Could/Won't)
- [x] Every metric has corresponding tracking events
- [x] No feature redundancy (check for duplicates)
- [x] No technical implementation details included
- [x] A new team member could understand this PRD

---

## Product Overview

### Vision

Give the platform operator complete, real-time visibility and control over every stage of AI podcast generation — from the exact prompts sent to language models, through voice synthesis configuration, to final audio delivery — so that no part of the pipeline is a black box.

### Problem Statement

The AI Digest platform currently generates podcasts through a 6-stage pipeline (content selection, script generation, quality review, TTS, assembly, upload), but the operator has **zero visibility** into:

1. **What prompts are sent to AI models** — The system prompt and user prompt for script generation are hardcoded and invisible in the UI. The operator cannot inspect, modify, or even see what instructions the AI receives.
2. **What the AI generates** — Only a 3-segment truncated preview is shown. The full script (typically 29 segments) is never visible.
3. **What happens during generation** — Stage progress shows only "pending/running/done" with no sub-stage detail. During TTS (the longest stage at 60-145 seconds), there is no indication of progress (e.g., "segment 12 of 29").
4. **What API calls are made** — ElevenLabs voice parameters, Anthropic token usage, S3 upload details are all invisible.
5. **What the generation cost** — The backend tracks budget ($5 cap per run) but never surfaces costs to the operator.
6. **What happened in past runs** — There is no episode history, no way to compare configurations, and no ability to re-run a previous generation with the same or modified settings.

**Evidence**: Codebase audit confirms: model is hardcoded to `claude-haiku-4-5-20251001` across all stages; voices are hardcoded to Brian/Sarah; the admin podcast page (`/admin/podcast`) only offers duration selection (5/10/15/20 min) and shows a 6-stage status indicator with polling. No log streaming, no prompt display, no cost tracking UI exists.

**Consequences of not solving**: The operator must trust the pipeline blindly. When output quality is poor (e.g., script scores below 7/10 threshold), there is no way to diagnose why without reading server logs. There is no way to experiment with different models, voices, or prompt styles. The platform cannot demonstrate transparency to stakeholders.

### Value Proposition

This dashboard transforms podcast generation from a black-box "click and wait" experience into a fully transparent, configurable, and auditable process. Operators can:
- See exactly what the AI is asked to do and what it produces
- Choose voices, models, and styles to match their editorial vision
- Watch generation happen in real-time with granular progress
- Review complete API call history for debugging and optimization
- Replay previous configurations to reproduce or iterate on past results

---

## User Personas

### Primary Persona: Platform Operator (Admin)
- **Demographics:** Technical content curator, comfortable with APIs and dashboards, manages the AI Digest platform daily
- **Goals:** Generate high-quality AI podcasts with full understanding of what the system is doing; quickly diagnose and fix quality issues; experiment with different configurations to find optimal output
- **Pain Points:** Cannot see AI prompts or full scripts; cannot change the AI model (stuck on Haiku); cannot preview different voices before committing; has no idea what generation costs; must SSH into server to debug failures

### Secondary Persona: Editorial Stakeholder
- **Demographics:** Non-technical team member who reviews podcast output quality
- **Goals:** Listen to generated episodes, review scripts for accuracy, provide feedback on tone and style
- **Pain Points:** Cannot access the generated script to review before publication; has no visibility into why some episodes sound better than others; cannot compare configurations across episodes

---

## User Journey Maps

### Primary User Journey: Podcast Generation with Full Transparency

1. **Configuration:** Operator opens the dashboard, selects a digest, chooses target duration, selects an AI model (Haiku/Sonnet/Opus), picks voices for Host A and Host B with audio preview, and adjusts style/tone settings
2. **Initiation:** Operator clicks "Generate" and sees the pipeline begin. Each stage shows real-time progress with expanding log sections
3. **Monitoring:** During script generation, the operator sees the exact system prompt and user prompt sent to Claude. When the script returns, the full dialogue is displayed (all segments, not just a 3-segment preview). During TTS, progress shows "Segment 5 of 29" with per-segment timing
4. **Review:** After completion, the operator sees: full transcript, audio player, total cost breakdown (Anthropic tokens + ElevenLabs characters + S3 storage), quality review scores, and generation timeline
5. **Iteration:** Operator adjusts configuration (e.g., switches to Opus model, changes Host B voice) and generates again. Both episodes appear in job history for comparison

### Secondary User Journey: Job History and Replay

1. **Browse:** Operator opens job history tab, sees list of all past generations with date, duration, model, status, and cost
2. **Inspect:** Clicking an episode reveals full details: configuration used, prompts sent, script generated, quality scores, cost breakdown, audio player
3. **Replay:** Operator clicks "Recreate with these settings" to pre-fill the generation form with a past configuration, then modifies one parameter (e.g., changes model from Haiku to Opus) and generates a new episode
4. **Compare:** Both the original and new episode are visible in history, enabling A/B comparison of output quality

---

## Feature Requirements

### Must Have Features

#### Feature 1: Prompt Visibility

- **User Story:** As an operator, I want to see the exact system prompt and user prompt sent to AI models during script generation so that I can understand what instructions drive the output.
- **Acceptance Criteria:**
  - [x] Given the operator starts a podcast generation, When the script generation stage begins, Then the dashboard displays the full system prompt text used for the AI call
  - [x] Given the script generation stage is running, When the user prompt is assembled from digest data, Then the dashboard displays the complete user prompt including all story data sent to the model
  - [x] Given the script generation completes, When the AI returns segments, Then the dashboard displays every segment (speaker, text, estimated duration) — not just a truncated preview
  - [x] Given the quality review stage runs, When scores are returned, Then the dashboard displays all sub-scores (naturalness, coverage, accuracy, engagement, pacing, transitions) and the overall score with pass/fail status
  - [x] Given the quality review requires revision, When multiple attempts occur, Then each attempt's scores and feedback are displayed chronologically

#### Feature 2: Model Selection

- **User Story:** As an operator, I want to choose which Claude model generates the podcast script so that I can trade cost for quality based on my needs.
- **Acceptance Criteria:**
  - [x] Given the operator is on the generation form, When they view model options, Then they see at least three choices: Haiku (fastest/cheapest), Sonnet (balanced), Opus (highest quality)
  - [x] Given the operator selects a model, When they generate a podcast, Then the selected model is used for both script generation and quality review stages
  - [x] Given different models have different pricing, When the generation completes, Then the cost breakdown shows actual token costs at the selected model's rate

#### Feature 3: Voice Configuration with Preview

- **User Story:** As an operator, I want to select and preview different ElevenLabs voices for each host so that I can find the right vocal identity for my podcast.
- **Acceptance Criteria:**
  - [x] Given the operator is configuring voices, When they open the voice selector for Host A or Host B, Then they see a list of available ElevenLabs voices with names
  - [x] Given a voice is selected, When the operator clicks "Preview", Then a short audio sample plays using that voice with sample text
  - [x] Given the operator adjusts voice settings (stability, similarity boost, speed, style), When they preview again, Then the sample reflects the updated settings
  - [x] Given the operator selects voices and settings, When they generate a podcast, Then those exact voice configurations are used for TTS

#### Feature 4: Real-Time Log Streaming

- **User Story:** As an operator, I want to see real-time progress and log entries as each pipeline stage executes so that I know exactly what is happening at every moment.
- **Acceptance Criteria:**
  - [x] Given a generation is in progress, When the content selection stage runs, Then the dashboard shows which stories were selected with their scores
  - [x] Given the TTS stage is processing, When each segment completes, Then the dashboard updates to show "Segment N of M completed" with elapsed time
  - [x] Given any API call is made (Anthropic, ElevenLabs, S3), When the call completes, Then the dashboard logs: endpoint called, status code, response time, and relevant metadata (tokens used, characters processed, bytes uploaded)
  - [x] Given a stage fails, When an error occurs, Then the dashboard displays the error message, the API response that caused it, and the retry attempt count
  - [x] Given the operator is viewing logs, When they scroll, Then previous log entries remain visible (append-only log, no overwriting)

#### Feature 5: Cost Tracking Dashboard

- **User Story:** As an operator, I want to see exactly how much each podcast generation costs so that I can manage my API spending.
- **Acceptance Criteria:**
  - [x] Given a generation completes, When the operator views the result, Then they see a cost breakdown: Anthropic (input tokens x rate + output tokens x rate), ElevenLabs (characters x rate), total cost
  - [x] Given multiple generations exist, When the operator views the dashboard, Then they see cumulative cost for the current month
  - [x] Given a budget threshold is set, When costs approach the threshold, Then a visual warning appears

#### Feature 6: Job History and Replay

- **User Story:** As an operator, I want to browse past podcast generations and recreate them with modified settings so that I can iterate on quality.
- **Acceptance Criteria:**
  - [x] Given past episodes exist, When the operator opens the history view, Then they see a list sorted by date with: title, duration, model used, status, cost, and audio player
  - [x] Given the operator clicks on a past episode, When the detail view opens, Then they see the complete configuration that was used (model, voices, duration, style)
  - [x] Given the operator clicks "Recreate", When the generation form opens, Then all fields are pre-filled with the past episode's configuration
  - [x] Given the operator modifies one setting and generates, When the new episode completes, Then both episodes are visible in history for comparison

#### Feature 7: Style/Tone Selection

- **User Story:** As an operator, I want to choose the conversational style and tone of the podcast so that I can match my audience's preferences.
- **Acceptance Criteria:**
  - [x] Given the operator is configuring a generation, When they view style options, Then they see at least 4 presets: Professional, Casual, Technical Deep-Dive, News Brief
  - [x] Given a style is selected, When the script is generated, Then the system prompt includes style-specific instructions that shape the dialogue's tone, vocabulary, and structure
  - [x] Given the operator wants a custom style, When they select "Custom", Then they can edit the style instructions directly (with the default as starting point)

### Should Have Features

#### Feature 8: Full Script Editor

- **User Story:** As an operator, I want to edit the generated script before TTS synthesis so that I can fix inaccuracies or improve phrasing.
- **Acceptance Criteria:**
  - [x] Given a script is generated, When the operator views it, Then each segment is editable (speaker assignment and text)
  - [x] Given the operator edits a segment, When they click "Regenerate Audio", Then only the modified segments are re-synthesized (not the entire episode)

#### Feature 9: Pipeline Stage Timing Analytics

- **User Story:** As an operator, I want to see how long each pipeline stage takes so that I can identify bottlenecks.
- **Acceptance Criteria:**
  - [x] Given a generation completes, When the operator views the timeline, Then each stage shows start time, end time, and duration
  - [x] Given multiple generations exist, When the operator views analytics, Then average stage durations are shown across recent episodes

### Could Have Features

#### Feature 10: A/B Comparison View

- **User Story:** As an operator, I want to compare two episodes side-by-side so that I can evaluate how configuration changes affect output quality.
- **Acceptance Criteria:**
  - [x] Given two episodes exist, When the operator selects both for comparison, Then a split-screen view shows configuration diff, script diff, quality scores, cost, and dual audio players

#### Feature 11: Scheduled Generation Presets

- **User Story:** As an operator, I want to save a generation configuration as a preset that runs automatically at a scheduled time.
- **Acceptance Criteria:**
  - [x] Given the operator configures a generation, When they click "Save as Preset", Then the configuration (model, voices, style, duration) is saved with a name
  - [x] Given a preset exists, When the daily pipeline cron runs, Then it automatically generates a podcast using the active preset

### Won't Have (This Phase)

- **Multi-language support** — Podcast generation will remain English-only. Multilingual TTS is a future consideration.
- **Public-facing dashboard** — This is an admin-only tool. Consumer-facing podcast quality indicators are out of scope.
- **Custom voice cloning** — ElevenLabs voice cloning requires separate licensing and is not included.
- **Real-time collaborative editing** — Single-operator editing only. Multi-user collaboration is out of scope.
- **Mobile-optimized dashboard** — The transparency dashboard is desktop-first. Mobile responsiveness is nice-to-have but not required.

---

## Detailed Feature Specifications

### Feature: Real-Time Log Streaming (Most Complex)

**Description:** As podcast generation progresses through 6 stages, the dashboard displays a live-updating log feed that shows every significant event: stage transitions, API calls, data selections, scores, errors, and timing information. The log is append-only, timestamped, and categorized by stage.

**User Flow:**
1. Operator clicks "Generate Podcast" with chosen configuration
2. Dashboard transitions to monitoring view with 6 stage indicators and a log panel
3. As content selection runs, log shows: "Selected 5 stories: [titles with scores]"
4. As script generation starts, log shows: "Calling Claude [model] with [token count] input tokens" followed by the full system prompt and user prompt in expandable sections
5. When script returns, log shows: "Received [N] segments, [M] output tokens, cost: $X.XX"
6. Quality review shows: "Attempt 1/3: Score 6.5/10 — REVISING" then "Attempt 2/3: Score 7.8/10 — PASSED"
7. TTS shows: "Segment 1/29 (Host A, 45 chars) — 2.3s" incrementally for each segment
8. Assembly shows: "Concatenating 29 segments + silence gaps, normalizing to -16 LUFS"
9. Upload shows: "Uploading to S3: episodes/2026-02-08.mp3 (4.2 MB) — 201 Created"
10. Final summary: total time, total cost, audio player, full transcript link

**Business Rules:**
- Rule 1: Log entries must appear within 1 second of the event occurring
- Rule 2: API keys and secrets must NEVER appear in log entries (redacted)
- Rule 3: Log entries persist for the lifetime of the episode record (not ephemeral)
- Rule 4: Each log entry includes: timestamp, stage name, severity (info/warn/error), message
- Rule 5: Expandable sections (prompts, full scripts) are collapsed by default to keep the log scannable

**Edge Cases:**
- Network disconnection during streaming -> Expected: Log reconnects automatically and fills in missed entries from stored log data
- TTS rate limit hit (429) -> Expected: Log shows "Rate limited, retrying in 2s (attempt 2/3)" with backoff details
- Script generation exceeds token limit -> Expected: Log shows truncation warning with actual vs. max token counts
- Quality review fails all 3 attempts -> Expected: Log shows warning "QA failed after 3 attempts (best score: 5.2), proceeding with current script" and the stage shows yellow "warn" status
- S3 upload fails -> Expected: Log shows error with HTTP status code and response body, episode status set to "failed"

---

## Success Metrics

### Key Performance Indicators

- **Adoption:** 100% of podcast generations use the new dashboard within first week (single operator system)
- **Engagement:** Operator inspects prompt/script details in >80% of generations (measuring whether transparency is actually used)
- **Quality:** Average quality review score improves from current baseline (measure over 10 generations with model selection enabled)
- **Business Impact:** 3 successful podcast generations with distinct configurations completed as deliverable validation

### Tracking Requirements

| Event | Properties | Purpose |
|-------|------------|---------|
| `generation_started` | model, duration, style, voices, digest_id | Track configuration preferences |
| `generation_completed` | episode_id, total_cost, total_duration_sec, quality_score | Measure success rate and cost |
| `generation_failed` | episode_id, failed_stage, error_message | Track failure patterns |
| `prompt_viewed` | episode_id, prompt_type (system/user) | Measure transparency engagement |
| `script_viewed` | episode_id, segments_count | Measure script review usage |
| `model_changed` | from_model, to_model | Track model preference shifts |
| `voice_previewed` | voice_id, settings | Track voice exploration |
| `job_replayed` | source_episode_id, changed_fields | Track iteration patterns |
| `cost_threshold_warning` | current_spend, threshold | Track budget awareness |

---

## Constraints and Assumptions

### Constraints
- **Budget**: ElevenLabs Pro plan (~$123/month for daily 10-minute podcasts). Anthropic costs vary by model (Haiku ~$0.02/episode, Opus ~$0.50/episode).
- **API Rate Limits**: ElevenLabs concurrent request limit (varies by plan). Sequential TTS processing is a constraint of the current architecture.
- **Model Availability**: Anthropic API key may have model access restrictions (user's key works with Haiku but NOT Sonnet/Opus per MEMORY.md — this must be verified and resolved).
- **Existing Infrastructure**: Must work within Next.js 15 App Router, BullMQ/Redis, PostgreSQL/Drizzle stack.
- **No Mocking**: All validation must use real API calls with real data. No placeholder endpoints, no fake audio, no simulated logs.

### Assumptions
- The operator has valid API keys for ElevenLabs and Anthropic with sufficient quota
- PostgreSQL and Redis are running locally for development
- The existing 6-stage pipeline architecture will be extended, not replaced
- ElevenLabs voices API (`/v1/voices`) returns available voices for the operator's account
- The operator is comfortable with a technical dashboard showing API details

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Anthropic API key doesn't support Opus/Sonnet models | High | Medium | Verify key permissions before implementation; gracefully disable unavailable models in UI |
| ElevenLabs rate limiting causes TTS failures during parallel experiments | Medium | Medium | Maintain sequential processing; show clear rate limit messages in logs |
| Real-time log streaming adds complexity to Next.js serverless architecture | Medium | Low | Use Server-Sent Events (SSE) which work in Next.js API routes; fall back to fast polling (1s) if needed |
| Cost explosion from operators experimenting with Opus model | High | Medium | Implement per-generation cost estimate before starting; show cumulative monthly spend; add configurable budget alert threshold |
| Large prompts/scripts exceed reasonable display area | Low | High | Use collapsible sections with "expand to see full content"; provide copy-to-clipboard for prompts |
| Log storage grows unbounded | Medium | Low | Store logs in database with episode lifecycle; implement retention policy in future phase |

---

## Open Questions

- [x] Does the operator's Anthropic API key support Sonnet and Opus models? (Must verify before implementing model selection)
- [x] What ElevenLabs plan is the operator on? (Determines available voices and concurrent request limits)
- [ ] Should generated scripts be editable before TTS, or is this a future phase? (Classified as "Should Have" — implement if time permits)
- [ ] What monthly budget ceiling should trigger warnings? (Default to $50/month with configurable threshold)

---

## Supporting Research

### Competitive Analysis

No direct competitors offer the exact combination of AI podcast generation + full pipeline transparency. However:
- **Notebook LM (Google)**: Generates podcasts from documents but offers zero configuration — no voice selection, no model choice, no prompt visibility. Black box.
- **Podcastle AI**: Voice cloning and editing, but no AI script generation pipeline visibility.
- **Descript**: Excellent editing tools, but no AI-generated podcast pipeline.

**Differentiator**: AI Digest is the only platform that combines automated AI podcast generation with complete operator transparency into every stage of the process.

### User Research

Based on codebase analysis and operator requirements:
- Operator explicitly requested "complete control over the prompts that go for the AI generation, with complete visibility into it"
- Operator requires "everything must be designed nicely" — professional UI is a hard requirement
- Operator needs "3 complete podcast generations with distinct configurations" as validation deliverable
- Current admin podcast page exists but is insufficient: no prompt display, truncated script preview, no model selection, stub voice preview

### Market Data

- AI podcast generation is an emerging category (2024-2026)
- ElevenLabs reports 1M+ users, indicating strong TTS API adoption
- The transparency/explainability trend in AI tools is accelerating — users increasingly demand to see what AI systems do, not just their outputs

---

## Validation Deliverables

### Three Complete Podcast Generations

Each generation must be validated with full evidence:

**Generation 1: Baseline (Haiku, Default Voices, Professional Style)**
- Model: Claude Haiku 4.5
- Voices: Brian (Host A), Sarah (Host B)
- Style: Professional
- Duration: 10 minutes
- Evidence: Screenshot of dashboard during generation, full prompt capture, cost breakdown, audio playback verification

**Generation 2: Premium (Opus, Different Voices, Casual Style)**
- Model: Claude Opus (if API key permits) or Claude Sonnet
- Voices: Different from Generation 1
- Style: Casual
- Duration: 15 minutes
- Evidence: Screenshot showing model selection, voice preview in action, full script display, cost comparison with Generation 1

**Generation 3: Technical (Sonnet, Custom Style, Short Format)**
- Model: Claude Sonnet
- Voices: Operator's choice with custom settings
- Style: Technical Deep-Dive (or custom)
- Duration: 5 minutes
- Evidence: Screenshot of custom style editor, job history showing all 3 episodes, replay configuration from Generation 1
