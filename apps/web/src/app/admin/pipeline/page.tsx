"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PipelineStatus } from "@/components/admin/pipeline-status";
import { PipelineHistory } from "@/components/admin/pipeline-history";
import { StageTimeline } from "@/components/admin/stage-timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StageData {
  readonly name: string;
  readonly status: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly error?: string | null;
  readonly itemsProcessed?: number;
}

interface RunData {
  readonly id: string;
  readonly status: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly itemsIngested?: number;
  readonly itemsScored?: number;
  readonly stages?: readonly StageData[];
}

type PipelineStatusType = "idle" | "running" | "completed" | "failed" | null;

function normalizeStatus(status: string | undefined | null): PipelineStatusType {
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

export default function AdminPipelinePage() {
  const [currentStatus, setCurrentStatus] = useState<PipelineStatusType>(null);
  const [currentStages, setCurrentStages] = useState<readonly StageData[]>([]);
  const [runs, setRuns] = useState<readonly RunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pipeline/status", {
        credentials: "include",
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: {
          current: {
            status: string;
            stages?: StageData[];
          } | null;
        };
      };
      if (data.success && data.data) {
        const current = data.data.current;
        setCurrentStatus(current ? normalizeStatus(current.status) : null);
        setCurrentStages(current?.stages ?? []);
      }
    } catch {
      // Silently handle fetch errors
    }
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pipeline/runs", {
        credentials: "include",
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: RunData[];
      };
      if (data.success && data.data) {
        setRuns(data.data);
      }
    } catch {
      // Silently handle fetch errors
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchRuns()]);
    setLoading(false);
  }, [fetchStatus, fetchRuns]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Auto-refresh every 10 seconds when running
  useEffect(() => {
    if (currentStatus === "running") {
      intervalRef.current = setInterval(() => {
        void fetchStatus();
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentStatus, fetchStatus]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await fetch("/api/admin/pipeline/trigger", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      // Give the pipeline a moment to start, then refresh
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      await fetchAll();
    } catch {
      // Silently handle trigger errors
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl text-accent mb-6">Pipeline</h1>

      {/* Current Status Section */}
      <div className="flex items-center gap-4 mb-8 p-4 border border-surface-elevated rounded-lg">
        <div className="flex-1">
          <p className="text-xs text-text-secondary uppercase mb-2">
            Current Status
          </p>
          <PipelineStatus status={currentStatus} />
        </div>
        <Button
          variant="primary"
          onClick={() => void handleTrigger()}
          disabled={triggering || currentStatus === "running"}
        >
          {triggering ? "Triggering..." : "Run Now"}
        </Button>
      </div>

      {/* Stage Timeline (visible when there are stages) */}
      {currentStages.length > 0 && (
        <div className="mb-8 p-4 border border-surface-elevated rounded-lg">
          <p className="text-xs text-text-secondary uppercase mb-4">
            Stage Progress
          </p>
          <StageTimeline stages={currentStages} />
        </div>
      )}

      {/* Run History */}
      <div>
        <p className="text-xs text-text-secondary uppercase mb-4">
          Run History
        </p>
        <PipelineHistory runs={runs} />
      </div>
    </div>
  );
}
