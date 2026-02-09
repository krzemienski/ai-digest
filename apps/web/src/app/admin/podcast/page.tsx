"use client";

import { useState, useCallback } from "react";
import { ConfigPanel } from "./components/config-panel";
import type { GenerationConfig } from "./components/config-panel";
import { GenerationMonitor } from "./components/generation-monitor";
import { JobHistory } from "./components/job-history";
import { EpisodeDetail } from "./components/episode-detail";
import type { EpisodeHistoryItem } from "./hooks/use-episode-history";

type Tab = "generate" | "history";
type GenerateView = "configuring" | "monitoring";

export default function PodcastDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  // Generate tab state
  const [generateView, setGenerateView] = useState<GenerateView>("configuring");
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [replayConfig, setReplayConfig] = useState<GenerationConfig | null>(null);

  // History tab state
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  // Handle generation start — switch to monitoring view
  const handleGenerate = useCallback((_config: GenerationConfig, episodeId: string) => {
    setCurrentEpisodeId(episodeId);
    setGenerateView("monitoring");
    setReplayConfig(null); // Clear replay config when starting new generation
  }, []);

  // Reset to config view for new generation
  const handleReset = useCallback(() => {
    setCurrentEpisodeId(null);
    setGenerateView("configuring");
  }, []);

  // Handle episode selection in history
  const handleEpisodeSelect = useCallback((episode: EpisodeHistoryItem) => {
    setSelectedEpisodeId(episode.id);
  }, []);

  // Handle replay from episode detail
  const handleReplay = useCallback((configSnapshot: Record<string, unknown>) => {
    // Parse config snapshot into GenerationConfig shape
    const config: GenerationConfig = {
      digestId: (configSnapshot.digestId as string) || "",
      targetDurationMinutes: (configSnapshot.targetDurationMinutes as 5 | 10 | 15 | 20 | 25 | 30 | 45 | 60) || 10,
      model: (configSnapshot.model as string) || "claude-haiku-4-5-20251001",
      style: (configSnapshot.style as GenerationConfig["style"]) || "professional",
      customStylePrompt: (configSnapshot.customStylePrompt as string | null) || null,
      voiceConfig: (configSnapshot.voiceConfig as GenerationConfig["voiceConfig"]) || {
        speakers: [],
        audioFormat: "mp3_44100_128",
        targetDurationMinutes: 10,
      },
    };

    setReplayConfig(config);
    setActiveTab("generate");
    setGenerateView("configuring");
    setCurrentEpisodeId(null);
  }, []);

  return (
    <div>
      <h1 className="text-2xl text-accent mb-6">Podcast Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-surface-elevated">
        <button
          type="button"
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === "generate"
              ? "text-accent border-accent"
              : "text-text-secondary border-transparent hover:text-text-primary hover:border-surface-elevated"
          }`}
        >
          Generate
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === "history"
              ? "text-accent border-accent"
              : "text-text-secondary border-transparent hover:text-text-primary hover:border-surface-elevated"
          }`}
        >
          History
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          {generateView === "configuring" && (
            <section className="bg-surface border border-surface-elevated rounded-lg p-6">
              <h2 className="text-lg text-accent mb-4">Configure Generation</h2>
              <ConfigPanel
                onGenerate={handleGenerate}
                disabled={generateView !== "configuring"}
                initialConfig={replayConfig ?? undefined}
              />
            </section>
          )}

          {generateView === "monitoring" && currentEpisodeId && (
            <section className="bg-surface border border-surface-elevated rounded-lg p-6">
              <GenerationMonitor
                episodeId={currentEpisodeId}
                onReset={handleReset}
              />
            </section>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <JobHistory
            selectedId={selectedEpisodeId}
            onSelect={handleEpisodeSelect}
          />

          {selectedEpisodeId && (
            <EpisodeDetail
              episodeId={selectedEpisodeId}
              onReplay={handleReplay}
            />
          )}
        </div>
      )}
    </div>
  );
}
