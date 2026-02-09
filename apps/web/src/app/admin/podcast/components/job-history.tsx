"use client";

import { useEpisodeHistory } from "../hooks/use-episode-history";
import type { EpisodeHistoryItem } from "../hooks/use-episode-history";
import { Badge } from "@/components/ui/badge";

interface JobHistoryProps {
  readonly selectedId: string | null;
  readonly onSelect: (episode: EpisodeHistoryItem) => void;
}

function StatusBadge({ status }: { readonly status: string }) {
  switch (status) {
    case "ready":
      return <Badge color="#10b981">Ready</Badge>;
    case "failed":
      return <Badge color="#ef4444">Failed</Badge>;
    case "generating":
      return (
        <span className="inline-flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <Badge color="#3b82f6">Generating</Badge>
        </span>
      );
    default:
      return <Badge color="#6b7280">{status}</Badge>;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function JobHistory({ selectedId, onSelect }: JobHistoryProps) {
  const { episodes, page, totalPages, total, loading, error, goToPage, refetch } = useEpisodeHistory();

  if (loading && episodes.length === 0) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-elevated rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-lg p-6">
        <div className="text-sm text-destructive">{error}</div>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 text-xs text-accent hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-lg p-6 text-center text-sm text-text-secondary">
        No episodes generated yet. Use the Generate tab to create your first podcast.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-surface-elevated rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-elevated">
        <span className="text-xs text-text-secondary uppercase">
          Episode History ({total} total)
        </span>
        <button
          type="button"
          onClick={refetch}
          className="text-xs text-accent hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-secondary uppercase border-b border-surface-elevated">
              <th className="text-left px-4 py-2 font-normal">Date</th>
              <th className="text-left px-4 py-2 font-normal">Duration</th>
              <th className="text-left px-4 py-2 font-normal">Model</th>
              <th className="text-left px-4 py-2 font-normal">Style</th>
              <th className="text-right px-4 py-2 font-normal">Cost</th>
              <th className="text-center px-4 py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {episodes.map((ep) => {
              const isSelected = selectedId === ep.id;
              return (
                <tr
                  key={ep.id}
                  onClick={() => onSelect(ep)}
                  className={`cursor-pointer border-b border-surface-elevated/30 transition-colors ${
                    isSelected
                      ? "bg-accent/5"
                      : "hover:bg-surface-elevated/30"
                  }`}
                >
                  <td className="px-4 py-2.5 text-text-primary">
                    {formatDate(ep.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary font-mono text-xs">
                    {formatDuration(ep.durationSeconds)}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary text-xs">
                    {ep.model ? ep.model.split("-").slice(1, 3).join(" ") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary text-xs capitalize">
                    {ep.style?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary">
                    {ep.costUsd !== null ? `$${ep.costUsd.toFixed(3)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <StatusBadge status={ep.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-elevated">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="text-xs text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="text-xs text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
