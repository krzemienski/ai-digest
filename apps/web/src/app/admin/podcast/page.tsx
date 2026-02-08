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

  return (
    <div>
      <h1 className="text-2xl text-accent mb-6">Podcast Configuration</h1>

      <div className="space-y-8">
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
