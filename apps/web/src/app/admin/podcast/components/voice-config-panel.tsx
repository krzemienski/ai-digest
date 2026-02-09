"use client";

import { useState, useCallback } from "react";
import { useVoices } from "../hooks/use-voices";
import type { VoiceOption } from "../hooks/use-voices";

interface VoiceSettings {
  readonly stability: number;
  readonly similarityBoost: number;
  readonly speed: number;
  readonly style: number;
}

interface SpeakerConfig {
  readonly voiceId: string;
  readonly settings: VoiceSettings;
}

interface VoiceConfigPanelProps {
  readonly hostA: SpeakerConfig;
  readonly hostB: SpeakerConfig;
  readonly onHostAChange: (config: SpeakerConfig) => void;
  readonly onHostBChange: (config: SpeakerConfig) => void;
  readonly disabled?: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  speed: 1.0,
  style: 0.0,
};

const SLIDERS: readonly {
  readonly key: keyof VoiceSettings;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}[] = [
  { key: "stability", label: "Stability", min: 0, max: 1, step: 0.05 },
  { key: "similarityBoost", label: "Similarity Boost", min: 0, max: 1, step: 0.05 },
  { key: "speed", label: "Speed", min: 0.5, max: 2, step: 0.1 },
  { key: "style", label: "Style", min: 0, max: 1, step: 0.05 },
];

function SpeakerPanel({
  label,
  config,
  onChange,
  voices,
  voicesLoading,
  disabled,
}: {
  readonly label: string;
  readonly config: SpeakerConfig;
  readonly onChange: (config: SpeakerConfig) => void;
  readonly voices: readonly VoiceOption[];
  readonly voicesLoading: boolean;
  readonly disabled?: boolean;
}) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleVoiceChange = useCallback(
    (voiceId: string) => {
      onChange({ ...config, voiceId });
      // Clear preview when voice changes
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    },
    [config, onChange, audioUrl]
  );

  const handleSettingChange = useCallback(
    (key: keyof VoiceSettings, value: number) => {
      onChange({
        ...config,
        settings: { ...config.settings, [key]: value },
      });
    },
    [config, onChange]
  );

  const handlePreview = useCallback(async () => {
    if (!config.voiceId) return;

    setPreviewLoading(true);
    setPreviewError(null);

    // Revoke old blob URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const res = await fetch("/api/admin/podcast/voice-preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: config.voiceId,
          settings: config.settings,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        setPreviewError(errorData.error ?? `Preview failed (${res.status})`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch {
      setPreviewError("Network error: could not generate preview");
    } finally {
      setPreviewLoading(false);
    }
  }, [config.voiceId, config.settings, audioUrl]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-accent">{label}</div>

      {/* Voice Dropdown */}
      <div>
        <label className="block text-xs text-text-secondary uppercase mb-1">
          Voice
        </label>
        <select
          value={config.voiceId}
          onChange={(e) => handleVoiceChange(e.target.value)}
          disabled={disabled || voicesLoading}
          className="w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm focus:outline-none focus:border-accent focus:transition-all disabled:opacity-50"
        >
          <option value="">
            {voicesLoading ? "Loading voices..." : "Select a voice"}
          </option>
          {voices.map((v) => (
            <option key={v.voiceId} value={v.voiceId}>
              {v.name} ({v.category})
            </option>
          ))}
        </select>
      </div>

      {/* Settings Sliders */}
      <div className="space-y-2">
        {SLIDERS.map(({ key, label: sliderLabel, min, max, step }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-xs text-text-secondary">{sliderLabel}</label>
              <span className="text-xs text-accent font-mono">
                {config.settings[key].toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={config.settings[key]}
              onChange={(e) => handleSettingChange(key, parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-surface-elevated accent-accent disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || previewLoading || !config.voiceId}
          onClick={() => void handlePreview()}
          className="bg-surface border border-accent text-accent text-xs px-3 h-8 rounded hover:bg-accent/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {previewLoading ? "Generating..." : "Preview"}
        </button>

        {audioUrl && (
          <audio controls src={audioUrl} className="h-8 flex-1" />
        )}

        {previewError && (
          <span className="text-xs text-destructive">{previewError}</span>
        )}
      </div>
    </div>
  );
}

export function VoiceConfigPanel({
  hostA,
  hostB,
  onHostAChange,
  onHostBChange,
  disabled,
}: VoiceConfigPanelProps) {
  const { voices, loading: voicesLoading, error: voicesError, refetch } = useVoices();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs text-text-secondary uppercase">
          Speaker Voices
        </label>
        {voicesError && (
          <button
            type="button"
            onClick={refetch}
            className="text-xs text-accent hover:underline"
          >
            Retry loading voices
          </button>
        )}
      </div>

      {voicesError && (
        <div className="text-xs text-destructive mb-3">{voicesError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg border border-surface-elevated rounded-lg p-4">
          <SpeakerPanel
            label="Host A"
            config={hostA}
            onChange={onHostAChange}
            voices={voices}
            voicesLoading={voicesLoading}
            disabled={disabled}
          />
        </div>
        <div className="bg-bg border border-surface-elevated rounded-lg p-4">
          <SpeakerPanel
            label="Host B"
            config={hostB}
            onChange={onHostBChange}
            voices={voices}
            voicesLoading={voicesLoading}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_SETTINGS };
export type { SpeakerConfig, VoiceSettings };
