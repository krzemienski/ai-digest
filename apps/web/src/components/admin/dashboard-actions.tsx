"use client";

import { useState } from "react";
import Link from "next/link";

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

  const handlePreviewNewsletter = async () => {
    try {
      const res = await fetch("/api/digests", { credentials: "include" });
      const data = (await res.json()) as {
        success: boolean;
        data?: ReadonlyArray<{ id: number }>;
      };

      if (data.success && data.data && data.data.length > 0) {
        const latestDigestId = data.data[0]?.id;
        if (latestDigestId) {
          window.open(
            `/api/admin/newsletter/${latestDigestId}/html`,
            "_blank"
          );
        }
      } else {
        alert("No digests available to preview");
      }
    } catch {
      alert("Failed to fetch digests");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg text-text-primary mb-4">Quick Actions</h2>
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
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

        <Link
          href="/admin/podcast"
          className="bg-accent text-bg font-bold px-4 py-2 rounded transition-opacity hover:opacity-90"
        >
          Generate Podcast
        </Link>

        <button
          onClick={() => void handlePreviewNewsletter()}
          type="button"
          className="bg-accent text-bg font-bold px-4 py-2 rounded transition-opacity hover:opacity-90"
        >
          Preview Newsletter
        </button>
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
