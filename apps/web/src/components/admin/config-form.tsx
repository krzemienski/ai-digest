"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopicRow {
  readonly name: string;
  readonly keywords: string;
  readonly weight: number;
}

interface ScoringState {
  readonly noveltyWeight: number;
  readonly impactWeight: number;
  readonly relevanceWeight: number;
  readonly minScore: number;
}

interface SynthesisState {
  readonly style: "brief" | "detailed" | "editorial";
  readonly maxItems: number;
}

interface BudgetState {
  readonly maxBudgetUsd: number;
}

interface ConfigResponse {
  readonly success: boolean;
  readonly data?: {
    readonly topics?: ReadonlyArray<{
      readonly name: string;
      readonly keywords: readonly string[];
      readonly weight: number;
    }>;
    readonly scoring?: {
      readonly noveltyWeight?: number;
      readonly impactWeight?: number;
      readonly relevanceWeight?: number;
      readonly minScore?: number;
    };
    readonly synthesis?: {
      readonly style?: string;
      readonly maxItems?: number;
    };
    readonly budget?: {
      readonly maxBudgetUsd?: number;
    };
  };
  readonly error?: string;
}

interface SaveResponse {
  readonly success: boolean;
  readonly error?: string;
}

const DEFAULT_SCORING: ScoringState = {
  noveltyWeight: 0.3,
  impactWeight: 0.4,
  relevanceWeight: 0.3,
  minScore: 0.5,
};

const DEFAULT_SYNTHESIS: SynthesisState = {
  style: "editorial",
  maxItems: 15,
};

const DEFAULT_BUDGET: BudgetState = {
  maxBudgetUsd: 5.0,
};

function toSynthesisStyle(value: string): "brief" | "detailed" | "editorial" {
  if (value === "brief" || value === "detailed" || value === "editorial") {
    return value;
  }
  return "editorial";
}

export function ConfigForm() {
  const [topics, setTopics] = useState<readonly TopicRow[]>([]);
  const [scoring, setScoring] = useState<ScoringState>(DEFAULT_SCORING);
  const [synthesis, setSynthesis] = useState<SynthesisState>(DEFAULT_SYNTHESIS);
  const [budget, setBudget] = useState<BudgetState>(DEFAULT_BUDGET);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ readonly type: "success" | "error"; readonly message: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config", { credentials: "include" });
        const data = (await res.json()) as ConfigResponse;

        if (data.success && data.data) {
          const d = data.data;

          if (d.topics && Array.isArray(d.topics)) {
            setTopics(
              d.topics.map((t) => ({
                name: t.name,
                keywords: Array.isArray(t.keywords) ? t.keywords.join(", ") : "",
                weight: t.weight,
              }))
            );
          }

          if (d.scoring) {
            setScoring({
              noveltyWeight: d.scoring.noveltyWeight ?? DEFAULT_SCORING.noveltyWeight,
              impactWeight: d.scoring.impactWeight ?? DEFAULT_SCORING.impactWeight,
              relevanceWeight: d.scoring.relevanceWeight ?? DEFAULT_SCORING.relevanceWeight,
              minScore: d.scoring.minScore ?? DEFAULT_SCORING.minScore,
            });
          }

          if (d.synthesis) {
            setSynthesis({
              style: toSynthesisStyle(d.synthesis.style ?? "editorial"),
              maxItems: d.synthesis.maxItems ?? DEFAULT_SYNTHESIS.maxItems,
            });
          }

          if (d.budget) {
            setBudget({
              maxBudgetUsd: d.budget.maxBudgetUsd ?? DEFAULT_BUDGET.maxBudgetUsd,
            });
          }
        }
      } catch {
        setFeedback({ type: "error", message: "Failed to load configuration" });
      } finally {
        setLoading(false);
      }
    };

    void fetchConfig();
  }, []);

  const handleAddTopic = useCallback(() => {
    setTopics((prev) => [...prev, { name: "", keywords: "", weight: 0.5 }]);
  }, []);

  const handleRemoveTopic = useCallback((index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleTopicChange = useCallback(
    (index: number, field: keyof TopicRow, value: string | number) => {
      setTopics((prev) =>
        prev.map((topic, i) =>
          i === index ? { ...topic, [field]: value } : topic
        )
      );
    },
    []
  );

  const handleScoringChange = useCallback(
    (field: keyof ScoringState, value: number) => {
      setScoring((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const topicsPayload = topics.map((t) => ({
        name: t.name.trim(),
        keywords: t.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
        weight: t.weight,
      }));

      const sections: ReadonlyArray<{ readonly key: string; readonly value: unknown }> = [
        { key: "topics", value: topicsPayload },
        { key: "scoring", value: scoring },
        { key: "synthesis", value: synthesis },
        { key: "budget", value: budget },
      ];

      const results = await Promise.all(
        sections.map(async (section) => {
          const res = await fetch(`/api/admin/config/${section.key}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(section.value),
          });
          return (await res.json()) as SaveResponse;
        })
      );

      const failed = results.find((r) => !r.success);
      if (failed) {
        setFeedback({ type: "error", message: failed.error ?? "Failed to save configuration" });
      } else {
        setFeedback({ type: "success", message: "Configuration saved successfully" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error: could not save configuration" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-cyber-surface border border-cyber-overlay rounded-lg p-6 animate-pulse">
            <div className="h-5 w-32 bg-cyber-overlay rounded mb-4" />
            <div className="h-10 w-full bg-cyber-overlay rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Topics Section */}
      <section className="bg-cyber-surface border border-cyber-overlay rounded-lg p-6">
        <h2 className="font-mono text-lg text-cyber-cyan mb-4">Topics</h2>
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
                    Name
                  </label>
                  <Input
                    value={topic.name}
                    onChange={(e) => handleTopicChange(index, "name", e.target.value)}
                    placeholder="Topic name"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
                    Keywords
                  </label>
                  <Input
                    value={topic.keywords}
                    onChange={(e) => handleTopicChange(index, "keywords", e.target.value)}
                    placeholder="keyword1, keyword2"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
                    Weight
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={topic.weight}
                    onChange={(e) => handleTopicChange(index, "weight", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                className="mt-5"
                onClick={() => handleRemoveTopic(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="default" size="sm" onClick={handleAddTopic}>
            Add Topic
          </Button>
        </div>
      </section>

      {/* Scoring Weights Section */}
      <section className="bg-cyber-surface border border-cyber-overlay rounded-lg p-6">
        <h2 className="font-mono text-lg text-cyber-cyan mb-4">Scoring Weights</h2>
        <div className="space-y-4">
          {(
            [
              { key: "noveltyWeight", label: "Novelty Weight" },
              { key: "impactWeight", label: "Impact Weight" },
              { key: "relevanceWeight", label: "Relevance Weight" },
              { key: "minScore", label: "Min Score Threshold" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-xs text-cyber-text-secondary uppercase">
                  {label}
                </label>
                <span className="font-mono text-sm text-cyber-cyan">
                  {scoring[key].toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={scoring[key]}
                onChange={(e) => handleScoringChange(key, parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-cyber-overlay accent-cyber-cyan touch-action-none"
                style={{ minHeight: "44px", padding: "16px 0" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Synthesis Section */}
      <section className="bg-cyber-surface border border-cyber-overlay rounded-lg p-6">
        <h2 className="font-mono text-lg text-cyber-cyan mb-4">Synthesis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
              Style
            </label>
            <select
              value={synthesis.style}
              onChange={(e) =>
                setSynthesis((prev) => ({
                  ...prev,
                  style: toSynthesisStyle(e.target.value),
                }))
              }
              className="w-full h-10 px-3 bg-cyber-bg border border-cyber-overlay rounded text-cyber-text font-mono text-sm focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all"
            >
              <option value="brief">Brief</option>
              <option value="detailed">Detailed</option>
              <option value="editorial">Editorial</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
              Max Items
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={synthesis.maxItems}
              onChange={(e) =>
                setSynthesis((prev) => ({
                  ...prev,
                  maxItems: parseInt(e.target.value, 10) || 15,
                }))
              }
            />
          </div>
        </div>
      </section>

      {/* Budget Section */}
      <section className="bg-cyber-surface border border-cyber-overlay rounded-lg p-6">
        <h2 className="font-mono text-lg text-cyber-cyan mb-4">Budget</h2>
        <div>
          <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
            Max Budget (USD)
          </label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={budget.maxBudgetUsd}
            onChange={(e) =>
              setBudget({ maxBudgetUsd: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </section>

      {/* Feedback */}
      {feedback !== null && (
        <p
          className={`font-mono text-sm ${
            feedback.type === "success" ? "text-cyber-green" : "text-cyber-magenta"
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
  );
}
