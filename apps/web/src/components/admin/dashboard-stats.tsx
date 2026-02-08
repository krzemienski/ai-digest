"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  readonly totalRuns: number;
  readonly totalItems: number;
  readonly subscriberCount: number;
  readonly lastRunStatus: string;
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
        const [runsRes, subscribersRes, statusRes] = await Promise.all([
          fetch("/api/admin/pipeline/runs", { credentials: "include" }),
          fetch("/api/admin/subscribers", { credentials: "include" }),
          fetch("/api/admin/pipeline/status", { credentials: "include" }),
        ]);

        const runsData = (await runsRes.json()) as {
          success: boolean;
          data?: ReadonlyArray<{ itemsIngested?: number }>;
        };
        const subscribersData = (await subscribersRes.json()) as {
          success: boolean;
          data?: { count: number };
        };
        const statusData = (await statusRes.json()) as {
          success: boolean;
          data?: { current: { status: string } | null };
        };

        const runs = runsData.success && runsData.data ? runsData.data : [];
        const totalItems = runs.reduce(
          (sum, run) => sum + (run.itemsIngested ?? 0),
          0
        );
        const subCount =
          subscribersData.success && subscribersData.data
            ? subscribersData.data.count
            : 0;
        const lastStatus =
          statusData.success && statusData.data?.current
            ? statusData.data.current.status
            : "idle";

        setStats({
          totalRuns: runs.length,
          totalItems,
          subscriberCount: subCount,
          lastRunStatus: lastStatus,
        });
      } catch {
        setStats({
          totalRuns: 0,
          totalItems: 0,
          subscriberCount: 0,
          lastRunStatus: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Items" value={stats.totalItems} />
      <StatCard label="Total Runs" value={stats.totalRuns} />
      <StatCard label="Subscribers" value={stats.subscriberCount} />
      <StatCard label="Last Run Status" value={stats.lastRunStatus} />
    </div>
  );
}
