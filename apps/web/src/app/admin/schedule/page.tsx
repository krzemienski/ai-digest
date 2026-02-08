"use client";

import { useEffect, useState, useCallback } from "react";
import { CronEditor } from "@/components/admin/cron-editor";
import { Button } from "@/components/ui/button";

interface ScheduleData {
  readonly cron: string;
  readonly timezone: string;
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

const DEFAULT_CRON = "0 8 * * *";

function parseScheduleFromConfig(raw: Record<string, unknown>): ScheduleData {
  const schedule = (raw["schedule"] ?? {}) as Record<string, unknown>;
  return {
    cron: typeof schedule["cron"] === "string" ? schedule["cron"] : DEFAULT_CRON,
    timezone: typeof schedule["timezone"] === "string" ? schedule["timezone"] : "UTC",
  };
}

export default function ScheduleConfigPage() {
  const [schedule, setSchedule] = useState<ScheduleData>({ cron: DEFAULT_CRON, timezone: "UTC" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ readonly type: "success" | "error"; readonly message: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/admin/config", { credentials: "include" });
        const data = (await res.json()) as ConfigApiResponse;

        if (data.success && data.data) {
          const parsed = parseScheduleFromConfig(data.data);
          setSchedule(parsed);
          setLastUpdated(new Date().toLocaleString());
        }
      } catch {
        setFeedback({ type: "error", message: "Failed to load schedule configuration" });
      } finally {
        setLoading(false);
      }
    };

    void fetchSchedule();
  }, []);

  const handleCronChange = useCallback((value: string) => {
    setSchedule((prev) => ({ ...prev, cron: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/config/schedule", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cron: schedule.cron, timezone: schedule.timezone }),
      });

      const data = (await res.json()) as SaveResponse;

      if (data.success) {
        setFeedback({ type: "success", message: "Schedule saved successfully" });
        setLastUpdated(new Date().toLocaleString());
      } else {
        setFeedback({ type: "error", message: data.error ?? "Failed to save schedule" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error: could not save schedule" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl text-accent mb-6">Pipeline Schedule</h1>
        <div className="space-y-6">
          {[1, 2].map((i) => (
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
      <h1 className="text-2xl text-accent mb-6">Pipeline Schedule</h1>

      <div className="space-y-8">
        {/* Current Schedule */}
        <section className="bg-surface border border-surface-elevated rounded-lg p-6">
          <h2 className="text-lg text-accent mb-4">Current Schedule</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary uppercase">Timezone:</span>
              <span className="text-sm text-text-primary">{schedule.timezone}</span>
            </div>
            {lastUpdated !== null && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary uppercase">Last Updated:</span>
                <span className="text-sm text-text-primary">{lastUpdated}</span>
              </div>
            )}
          </div>
        </section>

        {/* Cron Editor */}
        <section className="bg-surface border border-surface-elevated rounded-lg p-6">
          <h2 className="text-lg text-accent mb-4">Cron Expression</h2>
          <CronEditor value={schedule.cron} onChange={handleCronChange} />
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
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
