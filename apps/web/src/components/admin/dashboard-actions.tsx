"use client";

import { useState } from "react";

export function DashboardActions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleTrigger = async () => {
    setLoading(true);
    setResult(null);
    setIsError(false);

    try {
      const res = await fetch("/api/admin/pipeline/trigger", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        setResult("Pipeline triggered successfully");
        setIsError(false);
      } else {
        setResult(data.error ?? "Failed to trigger pipeline");
        setIsError(true);
      }
    } catch {
      setResult("Network error: could not reach server");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg text-text-primary mb-4">Quick Actions</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={() => void handleTrigger()}
          disabled={loading}
          type="button"
          className="bg-accent text-bg font-bold px-4 py-2 rounded disabled:opacity-50 transition-opacity"
        >
          {loading ? "Triggering..." : "Run Pipeline Now"}
        </button>
        {result !== null && (
          <span
            className={`text-sm ${isError ? "text-destructive" : "text-success"}`}
          >
            {result}
          </span>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg text-text-primary mb-4">Recent Activity</h2>
        <p className="text-sm text-text-secondary">
          Visit the Pipeline page for detailed run history and stage timelines.
        </p>
      </div>
    </div>
  );
}
