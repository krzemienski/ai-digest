"use client";

import { useEffect, useState, useCallback } from "react";
import { VoiceSelector } from "@/components/admin/voice-selector";
import { VoicePreview } from "@/components/admin/voice-preview";
import { Button } from "@/components/ui/button";

interface PodcastConfig {
  readonly hostAVoiceId: string;
  readonly hostBVoiceId: string;
  readonly stability: number;
  readonly similarityBoost: number;
  readonly speed: number;
  readonly style: number;
  readonly targetDurationMinutes: number;
  readonly audioFormat: string;
  readonly enabled: boolean;
}

interface ConfigApiResponse {
  readonly success: boolean;
  readonly data?: Record<string, unknown>;
  readonly error?: string;
}

interface SaveResponse {
  readonly success: boolean;
  readonly error?: string;
}

interface Digest {
  readonly id: string;
  readonly digestDate: string;
}

interface DigestsApiResponse {
  readonly success: boolean;
  readonly data?: ReadonlyArray<Digest>;
  readonly error?: string;
}

interface GenerateResponse {
  readonly success: boolean;
  readonly data?: { readonly episodeId: string };
  readonly error?: string;
}

type StageStatus = "pending" | "running" | "done" | "failed";

interface StageData {
  readonly status: StageStatus;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

interface StatusApiResponse {
  readonly success: boolean;
  readonly data?: {
    readonly id: string;
    readonly status: "generating" | "ready" | "failed";
    readonly audioUrl: string | null;
    readonly durationSeconds: number | null;
    readonly podcastStages: {
      readonly content_select: StageData;
      readonly script_gen: StageData;
      readonly quality_review: StageData;
      readonly tts: StageData;
      readonly assembly: StageData;
      readonly upload: StageData;
    };
    readonly scriptPreview: string | null;
  };
  readonly error?: string;
}

const DEFAULT_CONFIG: PodcastConfig = {
  hostAVoiceId: "",
  hostBVoiceId: "",
  stability: 0.5,
  similarityBoost: 0.75,
  speed: 1.0,
  style: 0.0,
  targetDurationMinutes: 15,
  audioFormat: "mp3_44100_128",
  enabled: false,
};

const AUDIO_FORMATS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
  { value: "mp3_44100_128", label: "MP3 44.1kHz 128kbps" },
  { value: "mp3_44100_192", label: "MP3 44.1kHz 192kbps" },
  { value: "pcm_44100", label: "PCM 44.1kHz" },
];

function toAudioFormat(value: string): string {
  const valid = AUDIO_FORMATS.find((f) => f.value === value);
  return valid ? valid.value : "mp3_44100_128";
}

function parseConfigData(raw: Record<string, unknown>): PodcastConfig {
  const podcast = (raw["podcast"] ?? {}) as Record<string, unknown>;
  return {
    hostAVoiceId: typeof podcast["hostAVoiceId"] === "string" ? podcast["hostAVoiceId"] : DEFAULT_CONFIG.hostAVoiceId,
    hostBVoiceId: typeof podcast["hostBVoiceId"] === "string" ? podcast["hostBVoiceId"] : DEFAULT_CONFIG.hostBVoiceId,
    stability: typeof podcast["stability"] === "number" ? podcast["stability"] : DEFAULT_CONFIG.stability,
    similarityBoost: typeof podcast["similarityBoost"] === "number" ? podcast["similarityBoost"] : DEFAULT_CONFIG.similarityBoost,
    speed: typeof podcast["speed"] === "number" ? podcast["speed"] : DEFAULT_CONFIG.speed,
    style: typeof podcast["style"] === "number" ? podcast["style"] : DEFAULT_CONFIG.style,
    targetDurationMinutes: typeof podcast["targetDurationMinutes"] === "number" ? podcast["targetDurationMinutes"] : DEFAULT_CONFIG.targetDurationMinutes,
    audioFormat: typeof podcast["audioFormat"] === "string" ? toAudioFormat(podcast["audioFormat"]) : DEFAULT_CONFIG.audioFormat,
    enabled: typeof podcast["enabled"] === "boolean" ? podcast["enabled"] : DEFAULT_CONFIG.enabled,
  };
}

export default function PodcastConfigPage() {
  const [config, setConfig] = useState<PodcastConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ readonly type: "success" | "error"; readonly message: string } | null>(null);

  // Generation state
  const [digests, setDigests] = useState<ReadonlyArray<Digest>>([]);
  const [selectedDigestId, setSelectedDigestId] = useState<string>("");
  const [targetDuration, setTargetDuration] = useState<number>(10);
  const [generating, setGenerating] = useState(false);
  const [generatingEpisodeId, setGeneratingEpisodeId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<StatusApiResponse["data"] | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config", { credentials: "include" });
        const data = (await res.json()) as ConfigApiResponse;

        if (data.success && data.data) {
          setConfig(parseConfigData(data.data));
        }
      } catch {
        setFeedback({ type: "error", message: "Failed to load podcast configuration" });
      } finally {
        setLoading(false);
      }
    };

    void fetchConfig();
  }, []);

  // Fetch available digests
  useEffect(() => {
    const fetchDigests = async () => {
      try {
        const res = await fetch("/api/digests", { credentials: "include" });
        const data = (await res.json()) as DigestsApiResponse;

        if (data.success && data.data && data.data.length > 0) {
          setDigests(data.data);
          const firstDigest = data.data[0];
          if (firstDigest) {
            setSelectedDigestId(firstDigest.id);
          }
        }
      } catch {
        // Silent fail - generation section will be disabled
      }
    };

    void fetchDigests();
  }, []);

  // Poll for status while generating
  useEffect(() => {
    if (!generating || !generatingEpisodeId) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/admin/podcast/status?episodeId=${generatingEpisodeId}`, {
          credentials: "include",
        });
        const data = (await res.json()) as StatusApiResponse;

        if (data.success && data.data) {
          setStatusData(data.data);

          if (data.data.status === "ready" || data.data.status === "failed") {
            setGenerating(false);
          }
        }
      } catch {
        // Silent fail - will retry on next poll
      }
    };

    void pollStatus();
    const interval = setInterval(() => void pollStatus(), 3000);

    return () => clearInterval(interval);
  }, [generating, generatingEpisodeId]);

  const updateConfig = useCallback(
    <K extends keyof PodcastConfig>(field: K, value: PodcastConfig[K]) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/config/podcast", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = (await res.json()) as SaveResponse;

      if (data.success) {
        setFeedback({ type: "success", message: "Podcast configuration saved successfully" });
      } else {
        setFeedback({ type: "error", message: data.error ?? "Failed to save configuration" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error: could not save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedDigestId) return;

    setGenerating(true);
    setStatusData(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/podcast/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          digestId: selectedDigestId,
          targetDurationMinutes: targetDuration,
        }),
      });

      const data = (await res.json()) as GenerateResponse;

      if (data.success && data.data) {
        setGeneratingEpisodeId(data.data.episodeId);
      } else {
        setFeedback({ type: "error", message: data.error ?? "Failed to start generation" });
        setGenerating(false);
      }
    } catch {
      setFeedback({ type: "error", message: "Network error: could not start generation" });
      setGenerating(false);
    }
  };

  const voiceSettings = {
    stability: config.stability,
    similarity_boost: config.similarityBoost,
    speed: config.speed,
    style: config.style,
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl text-accent mb-6">Podcast Configuration</h1>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-surface-elevated rounded-lg p-6 animate-pulse">
              <div className="h-5 w-40 bg-surface-elevated rounded mb-4" />
              <div className="h-10 w-full bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStageIcon = (status: StageStatus) => {
    switch (status) {
      case "pending":
        return <div className="w-4 h-4 rounded-full border-2 border-text-secondary" />;
      case "running":
        return <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />;
      case "done":
        return <div className="w-4 h-4 text-success">✓</div>;
      case "failed":
        return <div className="w-4 h-4 text-destructive">✕</div>;
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div>
      <h1 className="text-2xl text-accent mb-6">Podcast Configuration</h1>

      <div className="space-y-8">
        {/* GENERATION SECTION */}
        <section className="bg-surface border border-surface-elevated rounded-lg p-6">
          <h2 className="text-lg text-accent mb-4">Generate Podcast</h2>

          <div className="space-y-4">
            {/* Digest Selector */}
            <div>
              <label className="block text-xs text-text-secondary uppercase mb-1">
                Select Digest
              </label>
              <select
                value={selectedDigestId}
                onChange={(e) => setSelectedDigestId(e.target.value)}
                disabled={generating || digests.length === 0}
                className="w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm focus:outline-none focus:border-accent focus:transition-all disabled:opacity-50"
              >
                {digests.length === 0 && (
                  <option value="">No digests available</option>
                )}
                {digests.map((d) => (
                  <option key={d.id} value={d.id}>
                    {new Date(d.digestDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs text-text-secondary uppercase mb-2">
                Target Duration
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={generating}
                    onClick={() => setTargetDuration(mins)}
                    className={`flex-1 h-10 rounded border transition-all ${
                      targetDuration === mins
                        ? "bg-accent text-bg border-accent"
                        : "bg-bg text-text-primary border-surface-elevated hover:border-accent"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              variant="primary"
              size="lg"
              disabled={generating || !selectedDigestId}
              onClick={() => void handleGenerate()}
              className="w-full"
            >
              {generating ? "Generating..." : `Generate ${targetDuration}-min Podcast`}
            </Button>

            {/* Progress Monitor */}
            {statusData !== null && (
              <div className="mt-6 space-y-3">
                <div className="text-xs text-text-secondary uppercase mb-2">
                  Generation Progress
                </div>
                {(
                  [
                    { key: "content_select" as const, label: "Content Selection" },
                    { key: "script_gen" as const, label: "Script Generation" },
                    { key: "quality_review" as const, label: "Quality Review" },
                    { key: "tts" as const, label: "Text-to-Speech" },
                    { key: "assembly" as const, label: "Audio Assembly" },
                    { key: "upload" as const, label: "Upload" },
                  ]
                ).map(({ key, label }) => {
                  if (!statusData) return null;
                  const stage = statusData.podcastStages[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 bg-bg border border-surface-elevated rounded"
                    >
                      <div className="flex-shrink-0">{getStageIcon(stage.status)}</div>
                      <div className="flex-1">
                        <div className="text-sm text-text-primary">{label}</div>
                        <div className="text-xs text-text-secondary">
                          {stage.startedAt && `Started: ${formatTime(stage.startedAt)}`}
                          {stage.completedAt && ` • Completed: ${formatTime(stage.completedAt)}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Script Preview */}
            {statusData?.scriptPreview && statusData.status === "ready" && (
              <div className="mt-6">
                <div className="text-xs text-text-secondary uppercase mb-2">
                  Script Preview
                </div>
                <div className="p-4 bg-bg border border-surface-elevated rounded text-sm text-text-primary whitespace-pre-wrap">
                  {statusData.scriptPreview}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Speaker Voices */}
        <section className="bg-surface border border-surface-elevated rounded-lg p-6">
          <h2 className="text-lg text-accent mb-4">Speaker Voices</h2>
          <div className="space-y-5">
            <div className="space-y-3">
              <VoiceSelector
                label="Host A Voice ID"
                value={config.hostAVoiceId}
                onChange={(v) => updateConfig("hostAVoiceId", v)}
              />
              <VoicePreview voiceId={config.hostAVoiceId} settings={voiceSettings} />
            </div>

            <div className="border-t border-surface-elevated pt-5 space-y-3">
              <VoiceSelector
                label="Host B Voice ID"
                value={config.hostBVoiceId}
                onChange={(v) => updateConfig("hostBVoiceId", v)}
              />
              <VoicePreview voiceId={config.hostBVoiceId} settings={voiceSettings} />
            </div>
          </div>
        </section>

        {/* Voice Settings */}
        <section className="bg-surface border border-surface-elevated rounded-lg p-6">
          <h2 className="text-lg text-accent mb-4">Voice Settings</h2>
          <div className="space-y-4">
            {([
              { key: "stability" as const, label: "Stability", min: 0, max: 1, step: 0.05 },
              { key: "similarityBoost" as const, label: "Similarity Boost", min: 0, max: 1, step: 0.05 },
              { key: "speed" as const, label: "Speed", min: 0.5, max: 2, step: 0.1 },
              { key: "style" as const, label: "Style", min: 0, max: 1, step: 0.05 },
            ]).map(({ key, label, min, max, step }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-text-secondary uppercase">
                    {label}
                  </label>
                  <span className="text-sm text-accent">
                    {config[key].toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={config[key]}
                  onChange={(e) => updateConfig(key, parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-surface-elevated accent-accent"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Episode Settings */}
        <section className="bg-surface border border-surface-elevated rounded-lg p-6">
          <h2 className="text-lg text-accent mb-4">Episode Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-secondary uppercase mb-1">
                Target Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={config.targetDurationMinutes}
                onChange={(e) => updateConfig("targetDurationMinutes", parseInt(e.target.value, 10) || 15)}
                className="w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm focus:outline-none focus:border-accent focus:transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary uppercase mb-1">
                Audio Format
              </label>
              <select
                value={config.audioFormat}
                onChange={(e) => updateConfig("audioFormat", toAudioFormat(e.target.value))}
                className="w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm focus:outline-none focus:border-accent focus:transition-all"
              >
                {AUDIO_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig("enabled", e.target.checked)}
                className="w-5 h-5 rounded border-surface-elevated bg-bg text-accent accent-accent cursor-pointer"
              />
              <span className="text-sm text-text-primary">
                Enable Podcast Generation
              </span>
            </label>
          </div>
        </section>

        {/* Feedback */}
        {feedback !== null && (
          <p
            className={`text-sm ${
              feedback.type === "success" ? "text-success" : "text-destructive"
            }`}
          >
            {feedback.message}
          </p>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
