"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  readonly totalItems: number;
  readonly totalDigests: number;
  readonly totalEpisodes: number;
  readonly totalSubscribers: number;
  readonly latestPipelineRun: {
    readonly status: string;
    readonly startedAt: string;
    readonly completedAt: string | null;
    readonly itemsIngested: number;
    readonly costUsd: number | null;
  } | null;
  readonly sourceHealth: {
    readonly healthy: number;
    readonly degraded: number;
    readonly erroring: number;
  };
}

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs text-text-secondary uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold text-accent">{String(value)}</p>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </Card>
  );
}

export function DashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        const data = (await res.json()) as {
          success: boolean;
          data?: StatsData;
        };

        if (data.success && data.data) {
          setStats(data.data);
        } else {
          setStats({
            totalItems: 0,
            totalDigests: 0,
            totalEpisodes: 0,
            totalSubscribers: 0,
            latestPipelineRun: null,
            sourceHealth: { healthy: 0, degraded: 0, erroring: 0 },
          });
        }
      } catch {
        setStats({
          totalItems: 0,
          totalDigests: 0,
          totalEpisodes: 0,
          totalSubscribers: 0,
          latestPipelineRun: null,
          sourceHealth: { healthy: 0, degraded: 0, erroring: 0 },
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
          <Card>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.totalItems} />
        <StatCard label="Total Digests" value={stats.totalDigests} />
        <StatCard label="Episodes Ready" value={stats.totalEpisodes} />
        <StatCard label="Active Subscribers" value={stats.totalSubscribers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-bold text-text-primary mb-3">
            Latest Pipeline Run
          </h3>
          {stats.latestPipelineRun ? (
            <div className="space-y-1 text-sm">
              <p className="text-text-secondary">
                <span className="text-text-primary font-medium">Status:</span>{" "}
                {stats.latestPipelineRun.status}
              </p>
              <p className="text-text-secondary">
                <span className="text-text-primary font-medium">Started:</span>{" "}
                {new Date(stats.latestPipelineRun.startedAt).toLocaleString()}
              </p>
              {stats.latestPipelineRun.completedAt && (
                <p className="text-text-secondary">
                  <span className="text-text-primary font-medium">
                    Completed:
                  </span>{" "}
                  {new Date(
                    stats.latestPipelineRun.completedAt
                  ).toLocaleString()}
                </p>
              )}
              <p className="text-text-secondary">
                <span className="text-text-primary font-medium">
                  Items Ingested:
                </span>{" "}
                {stats.latestPipelineRun.itemsIngested}
              </p>
              {stats.latestPipelineRun.costUsd !== null && (
                <p className="text-text-secondary">
                  <span className="text-text-primary font-medium">Cost:</span> $
                  {stats.latestPipelineRun.costUsd.toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No runs yet</p>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-text-primary mb-3">
            Source Health
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-text-secondary">
              <span className="text-success font-medium">Healthy:</span>{" "}
              {stats.sourceHealth.healthy}
            </p>
            <p className="text-text-secondary">
              <span className="text-warning font-medium">Degraded:</span>{" "}
              {stats.sourceHealth.degraded}
            </p>
            <p className="text-text-secondary">
              <span className="text-destructive font-medium">Erroring:</span>{" "}
              {stats.sourceHealth.erroring}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
