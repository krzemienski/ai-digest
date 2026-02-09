"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ModelSelector } from "./model-selector";
import { VoiceConfigPanel, DEFAULT_SETTINGS } from "./voice-config-panel";
import type { SpeakerConfig } from "./voice-config-panel";
import { StyleSelector } from "./style-selector";
import { TimeWindowPicker } from "./time-window-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PodcastStyle, CostEstimate } from "@ai-digest/shared";

interface Digest {
  readonly id: string;
  readonly digestDate: string;
}

interface DigestsApiResponse {
  readonly success: boolean;
  readonly data?: readonly Digest[];
  readonly error?: string;
}

interface CostEstimateResponse {
  readonly success: boolean;
  readonly data?: {
    readonly estimatedCost: CostEstimate;
    readonly model: { readonly id: string; readonly name: string; readonly tier: string };
    readonly warning?: string;
  };
  readonly error?: string;
}

interface GenerateResponse {
  readonly success: boolean;
  readonly data?: { readonly episodeId: string; readonly jobId: string };
  readonly error?: string;
}

interface SpendResponse {
  readonly success: boolean;
  readonly data?: {
    readonly currentMonth: {
      readonly total: number;
      readonly count: number;
      readonly year: number;
      readonly month: number;
    };
    readonly threshold: number;
  };
  readonly error?: string;
}

export interface GenerationConfig {
  readonly digestId: string | null;
  readonly dateRange: { readonly start: string; readonly end: string } | null;
  readonly targetDurationMinutes: 5 | 10 | 15 | 20 | 25 | 30 | 45 | 60;
  readonly model: string;
  readonly style: PodcastStyle;
  readonly customStylePrompt: string | null;
  readonly voiceConfig: {
    readonly speakers: readonly {
      readonly role: string;
      readonly voiceId: string;
      readonly settings: {
        readonly stability: number;
        readonly similarityBoost: number;
        readonly speed: number;
        readonly style: number;
      };
    }[];
    readonly audioFormat: string;
    readonly targetDurationMinutes: number;
  };
}

interface ConfigPanelProps {
  readonly onGenerate: (config: GenerationConfig, episodeId: string) => void;
  readonly disabled?: boolean;
  readonly initialConfig?: GenerationConfig;
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export function ConfigPanel({ onGenerate, disabled, initialConfig }: ConfigPanelProps) {
  // Content source state
  const [contentSource, setContentSource] = useState<"digest" | "timeWindow">("timeWindow");
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Digest state
  const [digests, setDigests] = useState<readonly Digest[]>([]);
  const [selectedDigestId, setSelectedDigestId] = useState("");

  // Config state
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [targetDuration, setTargetDuration] = useState<5 | 10 | 15 | 20 | 25 | 30 | 45 | 60>(10);
  const [style, setStyle] = useState<PodcastStyle>("professional");
  const [customStylePrompt, setCustomStylePrompt] = useState("");
  const [hostA, setHostA] = useState<SpeakerConfig>({
    voiceId: "",
    settings: DEFAULT_SETTINGS,
  });
  const [hostB, setHostB] = useState<SpeakerConfig>({
    voiceId: "",
    settings: DEFAULT_SETTINGS,
  });

  // Cost estimate
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [costWarning, setCostWarning] = useState<string | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const costDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Monthly spend
  const [monthlySpend, setMonthlySpend] = useState<{ total: number; count: number; threshold: number } | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch digests
  useEffect(() => {
    const fetchDigests = async () => {
      try {
        const res = await fetch("/api/digests", { credentials: "include" });
        const data = (await res.json()) as DigestsApiResponse;
        if (data.success && data.data && data.data.length > 0) {
          setDigests(data.data);
          const first = data.data[0];
          if (first) setSelectedDigestId(first.id);
        }
      } catch {
        // Silent — digest selector will show empty
      }
    };
    void fetchDigests();
  }, []);

  // Populate state from initialConfig (for replay)
  useEffect(() => {
    if (!initialConfig) return;

    if (initialConfig.dateRange) {
      setContentSource("timeWindow");
      setDateRange(initialConfig.dateRange);
    } else if (initialConfig.digestId) {
      setContentSource("digest");
      setSelectedDigestId(initialConfig.digestId);
    }

    setTargetDuration(initialConfig.targetDurationMinutes);
    setModel(initialConfig.model);
    setStyle(initialConfig.style);
    setCustomStylePrompt(initialConfig.customStylePrompt ?? "");

    // Find host configs by role
    const hostAConfig = initialConfig.voiceConfig.speakers.find((s) => s.role === "host_a");
    const hostBConfig = initialConfig.voiceConfig.speakers.find((s) => s.role === "host_b");

    if (hostAConfig) {
      setHostA({
        voiceId: hostAConfig.voiceId,
        settings: hostAConfig.settings,
      });
    }

    if (hostBConfig) {
      setHostB({
        voiceId: hostBConfig.voiceId,
        settings: hostBConfig.settings,
      });
    }
  }, [initialConfig]);

  // Fetch monthly spend
  useEffect(() => {
    const fetchSpend = async () => {
      try {
        const res = await fetch("/api/admin/podcast/spend", { credentials: "include" });
        const data = (await res.json()) as SpendResponse;
        if (data.success && data.data) {
          setMonthlySpend({
            total: data.data.currentMonth.total,
            count: data.data.currentMonth.count,
            threshold: data.data.threshold,
          });
        }
      } catch {
        // Silent
      }
    };
    void fetchSpend();
  }, []);

  // Debounced cost estimate
  useEffect(() => {
    if (costDebounceRef.current) {
      clearTimeout(costDebounceRef.current);
    }

    costDebounceRef.current = setTimeout(() => {
      const fetchCost = async () => {
        setCostLoading(true);
        try {
          const res = await fetch("/api/admin/podcast/cost-estimate", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, targetDurationMinutes: targetDuration }),
          });
          const data = (await res.json()) as CostEstimateResponse;
          if (data.success && data.data) {
            setCostEstimate(data.data.estimatedCost);
            setCostWarning(data.data.warning ?? null);
          }
        } catch {
          // Silent — cost estimate is informational
        } finally {
          setCostLoading(false);
        }
      };
      void fetchCost();
    }, 500);

    return () => {
      if (costDebounceRef.current) {
        clearTimeout(costDebounceRef.current);
      }
    };
  }, [model, targetDuration]);

  const handleStyleChange = useCallback((newStyle: PodcastStyle, newCustom: string) => {
    setStyle(newStyle);
    setCustomStylePrompt(newCustom);
  }, []);

  const handleGenerate = useCallback(async () => {
    const hasValidSource =
      (contentSource === "digest" && selectedDigestId) ||
      (contentSource === "timeWindow" && dateRange);
    if (!hasValidSource) return;

    setGenerating(true);
    setError(null);

    const config: GenerationConfig = {
      digestId: contentSource === "digest" ? selectedDigestId : null,
      dateRange: contentSource === "timeWindow" ? dateRange : null,
      targetDurationMinutes: targetDuration,
      model,
      style,
      customStylePrompt: style === "custom" ? customStylePrompt : null,
      voiceConfig: {
        speakers: [
          { role: "host_a", voiceId: hostA.voiceId, settings: hostA.settings },
          { role: "host_b", voiceId: hostB.voiceId, settings: hostB.settings },
        ],
        audioFormat: "mp3_44100_128",
        targetDurationMinutes: targetDuration,
      },
    };

    try {
      const res = await fetch("/api/admin/podcast/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = (await res.json()) as GenerateResponse;

      if (data.success && data.data) {
        onGenerate(config, data.data.episodeId);
      } else {
        setError(data.error ?? "Failed to start generation");
        setGenerating(false);
      }
    } catch {
      setError("Network error: could not start generation");
      setGenerating(false);
    }
  }, [contentSource, selectedDigestId, dateRange, targetDuration, model, style, customStylePrompt, hostA, hostB, onGenerate]);

  const canGenerate =
    ((contentSource === "digest" && selectedDigestId) ||
      (contentSource === "timeWindow" && dateRange)) &&
    !generating &&
    !disabled;

  return (
    <div className="space-y-6">
      {/* Monthly Spend Banner */}
      {monthlySpend && monthlySpend.total > 0 && (
        <div
          className={`flex items-center justify-between p-3 rounded border text-sm ${
            monthlySpend.total > monthlySpend.threshold * 0.8
              ? "border-destructive/50 bg-destructive/5 text-destructive"
              : "border-surface-elevated bg-surface text-text-secondary"
          }`}
        >
          <span>
            This month: ${monthlySpend.total.toFixed(2)} across {monthlySpend.count} episode{monthlySpend.count !== 1 ? "s" : ""}
          </span>
          <span>Threshold: ${monthlySpend.threshold}</span>
        </div>
      )}

      {/* Content Source Toggle */}
      <div>
        <label className="block text-xs text-text-secondary uppercase mb-2">
          Content Source
        </label>
        <div className="flex gap-2 mb-3">
          {(["digest", "timeWindow"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={generating || disabled}
              onClick={() => setContentSource(mode)}
              className={`h-10 px-3 rounded border transition-all text-sm ${
                contentSource === mode
                  ? "bg-accent text-bg border-accent font-medium"
                  : "bg-bg text-text-primary border-surface-elevated hover:border-accent"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {mode === "digest" ? "From Digest" : "Time Window"}
            </button>
          ))}
        </div>

        {/* Digest Selector */}
        {contentSource === "digest" && (
          <div>
            <label className="block text-xs text-text-secondary uppercase mb-1">
              Select Digest
            </label>
            <select
              value={selectedDigestId}
              onChange={(e) => setSelectedDigestId(e.target.value)}
              disabled={generating || disabled || digests.length === 0}
              className="w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm focus:outline-none focus:border-accent focus:transition-all disabled:opacity-50"
            >
              {digests.length === 0 && <option value="">No digests available</option>}
              {digests.map((d) => (
                <option key={d.id} value={d.id}>
                  {new Date(d.digestDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Time Window Picker */}
        {contentSource === "timeWindow" && (
          <TimeWindowPicker onDateRangeChange={setDateRange} />
        )}
      </div>

      {/* Duration Selector */}
      <div>
        <label className="block text-xs text-text-secondary uppercase mb-2">
          Target Duration
        </label>
        <div className="flex gap-2 flex-wrap">
          {([5, 10, 15, 20, 25, 30, 45, 60] as const).map((mins) => (
            <button
              key={mins}
              type="button"
              disabled={generating || disabled}
              onClick={() => setTargetDuration(mins)}
              className={`h-10 px-3 rounded border transition-all text-sm ${
                targetDuration === mins
                  ? "bg-accent text-bg border-accent font-medium"
                  : "bg-bg text-text-primary border-surface-elevated hover:border-accent"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      {/* Model Selector */}
      <ModelSelector
        value={model}
        onChange={setModel}
        disabled={generating || disabled}
      />

      {/* Style Selector */}
      <StyleSelector
        value={style}
        customPrompt={customStylePrompt}
        onChange={handleStyleChange}
        disabled={generating || disabled}
      />

      {/* Voice Config */}
      <VoiceConfigPanel
        hostA={hostA}
        hostB={hostB}
        onHostAChange={setHostA}
        onHostBChange={setHostB}
        disabled={generating || disabled}
      />

      {/* Cost Estimate */}
      <div className="bg-bg border border-surface-elevated rounded-lg p-4">
        <div className="text-xs text-text-secondary uppercase mb-2">
          Estimated Cost
        </div>
        {costLoading ? (
          <div className="text-sm text-text-secondary animate-pulse">Calculating...</div>
        ) : costEstimate ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Anthropic (script)</span>
              <span className="text-text-primary">${costEstimate.anthropic.cost.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">ElevenLabs (TTS)</span>
              <span className="text-text-primary">${costEstimate.elevenlabs.cost.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium border-t border-surface-elevated pt-1 mt-1">
              <span className="text-text-primary">Total</span>
              <span className="text-accent">${costEstimate.total.toFixed(3)}</span>
            </div>
            {costWarning && (
              <div className="flex items-center gap-2 mt-2">
                <Badge color="#f59e0b">Warning</Badge>
                <span className="text-xs text-text-secondary">{costWarning}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-text-secondary">Select model to see estimate</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {/* Generate Button */}
      <Button
        variant="primary"
        size="lg"
        disabled={!canGenerate}
        onClick={() => void handleGenerate()}
        className="w-full"
      >
        {generating
          ? "Starting Generation..."
          : `Generate ${targetDuration}-min Podcast`}
      </Button>
    </div>
  );
}
