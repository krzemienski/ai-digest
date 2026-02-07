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
  rss: "#FF8800",
  github: "#F0F0F5",
  arxiv: "#B31B1B",
  hackernews: "#FF6600",
  huggingface: "#FFD21E",
  reddit: "#FF4500",
  producthunt: "#DA552F",
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#00FFFF";
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
      <div className="text-center py-12 border border-cyber-overlay rounded-lg">
        <p className="font-mono text-cyber-text-secondary text-sm">
          No sources configured. Add one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-cyber-overlay">
            <th className="text-left py-3 px-4 font-mono text-xs text-cyber-text-secondary uppercase tracking-wider">
              Name
            </th>
            <th className="text-left py-3 px-4 font-mono text-xs text-cyber-text-secondary uppercase tracking-wider">
              Type
            </th>
            <th className="text-left py-3 px-4 font-mono text-xs text-cyber-text-secondary uppercase tracking-wider">
              Enabled
            </th>
            <th className="text-right py-3 px-4 font-mono text-xs text-cyber-text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.id} className="border-b border-cyber-overlay/50 hover:bg-cyber-overlay/20 transition-colors">
              <td className="py-3 px-4 text-cyber-text font-mono">
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
                      source.enabled ? "bg-cyber-green shadow-neon-green" : "bg-cyber-magenta"
                    }`}
                  />
                  <span className="font-mono text-xs text-cyber-text-secondary">
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
