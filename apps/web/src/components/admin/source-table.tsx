"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SourceData {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly config: Record<string, unknown>;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface SourceTableProps {
  readonly onEdit: (source: SourceData) => void;
}

const TYPE_COLORS: Record<string, string> = {
  rss: "#3b82f6",
  github: "#22c55e",
  arxiv: "#ef4444",
  hackernews: "#f97316",
  huggingface: "#eab308",
  reddit: "#f97316",
  producthunt: "#f97316",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#3b82f6";
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SourceTable({ onEdit }: SourceTableProps) {
  const [sources, setSources] = useState<readonly SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sources", { credentials: "include" });
      const data = (await res.json()) as { success: boolean; data?: SourceData[] };
      if (data.success && data.data) {
        setSources(data.data);
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSources();
  }, [fetchSources]);

  const handleToggleEnabled = async (source: SourceData) => {
    try {
      await fetch(`/api/admin/sources/${source.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !source.enabled }),
      });
      void fetchSources();
    } catch {
      // Silently handle toggle errors
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/sources/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteConfirmId(null);
      void fetchSources();
    } catch {
      // Silently handle delete errors
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-12 border border-surface-elevated rounded-lg">
        <p className="text-text-secondary text-sm">
          No sources configured. Add one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <table className="w-full border-collapse text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-surface-elevated">
            <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider whitespace-nowrap">
              Name
            </th>
            <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider whitespace-nowrap">
              Type
            </th>
            <th className="text-left py-3 px-4 text-xs text-text-secondary uppercase tracking-wider whitespace-nowrap">
              Enabled
            </th>
            <th className="text-right py-3 px-4 text-xs text-text-secondary uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.id} className="border-b border-surface-elevated/50 hover:bg-surface-elevated/20 transition-colors">
              <td className="py-3 px-4 text-text-primary">
                {source.name}
              </td>
              <td className="py-3 px-4">
                <Badge color={getTypeColor(source.type)}>{source.type}</Badge>
              </td>
              <td className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => void handleToggleEnabled(source)}
                  className="flex items-center gap-2 cursor-pointer"
                  aria-label={`Toggle ${source.name} ${source.enabled ? "off" : "on"}`}
                >
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      source.enabled ? "bg-success" : "bg-destructive"
                    }`}
                  />
                  <span className="text-xs text-text-secondary">
                    {source.enabled ? "on" : "off"}
                  </span>
                </button>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onEdit(source)}
                  >
                    Edit
                  </Button>
                  {deleteConfirmId === source.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDelete(source.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteConfirmId(source.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
