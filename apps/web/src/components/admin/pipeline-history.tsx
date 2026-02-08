"use client";

import { useState } from "react";
import { PipelineStatus } from "@/components/admin/pipeline-status";

interface PipelineStageData {
  readonly name: string;
  readonly status: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly error?: string | null;
  readonly itemsProcessed?: number;
}

interface PipelineRunData {
  readonly id: string;
  readonly status: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly itemsIngested?: number;
  readonly itemsScored?: number;
  readonly stages?: readonly PipelineStageData[];
}

interface PipelineHistoryProps {
  readonly runs: readonly PipelineRunData[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "\u2014";
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${String(minutes)}m ${String(seconds)}s`;
  return `${String(seconds)}s`;
}

function normalizeStatus(
  status: string
): "idle" | "running" | "completed" | "failed" | null {
  if (
    status === "idle" ||
    status === "running" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }
  return null;
}

export function PipelineHistory({ runs }: PipelineHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (runs.length === 0) {
    return (
      <div className="text-center py-12 border border-surface-elevated rounded-lg">
        <p className="text-text-secondary text-sm">
          No pipeline runs yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <table className="w-full border-collapse text-sm min-w-[560px]">
        <thead>
          <tr className="border-b border-surface-elevated">
            <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider">
              Date
            </th>
            <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider">
              Duration
            </th>
            <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider">
              Items
            </th>
            <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="group">
              <td
                colSpan={5}
                className="p-0"
              >
                <button
                  type="button"
                  className="w-full text-left border-b border-surface-elevated/50 hover:bg-surface-elevated/20 transition-colors cursor-pointer"
                  onClick={() => handleToggle(run.id)}
                  aria-expanded={expandedId === run.id}
                >
                  <div className="flex items-center">
                    <span className="py-3 px-4 text-text-primary flex-1 min-w-[140px]">
                      {formatDate(run.startedAt)}
                    </span>
                    <span className="py-3 px-4 flex-1">
                      <PipelineStatus status={normalizeStatus(run.status)} />
                    </span>
                    <span className="py-3 px-4 text-text-secondary flex-1">
                      {formatDuration(run.startedAt, run.completedAt)}
                    </span>
                    <span className="py-3 px-4 text-text-secondary flex-1">
                      {run.itemsIngested != null ? String(run.itemsIngested) : "\u2014"}
                    </span>
                    <span className="py-3 px-4 text-right text-text-secondary">
                      {expandedId === run.id ? "\u25B2" : "\u25BC"}
                    </span>
                  </div>
                </button>
                {expandedId === run.id && run.stages && run.stages.length > 0 && (
                  <div className="px-4 py-3 bg-surface-elevated/10 border-b border-surface-elevated/50">
                    <div className="space-y-2">
                      {run.stages.map((stage, idx) => (
                        <div
                          key={`${run.id}-stage-${String(idx)}`}
                          className="flex items-center gap-3 text-xs"
                        >
                          <span className="text-text-secondary w-24">
                            {stage.name}
                          </span>
                          <PipelineStatus
                            status={normalizeStatus(stage.status)}
                          />
                          <span className="text-text-secondary">
                            {formatDuration(
                              stage.startedAt ?? run.startedAt,
                              stage.completedAt
                            )}
                          </span>
                          {stage.itemsProcessed != null && (
                            <span className="text-text-secondary">
                              {String(stage.itemsProcessed)} items
                            </span>
                          )}
                          {stage.error && (
                            <span className="text-destructive truncate max-w-[200px]">
                              {stage.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
