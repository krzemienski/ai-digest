"use client";

import { useEffect, useState } from "react";
import { SubscriberTable } from "@/components/admin/subscriber-table";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriberRow {
  readonly id: string;
  readonly email: string;
  readonly status: string;
  readonly subscribedAt: string;
  readonly unsubscribedAt?: string | null;
}

interface SubscribersApiResponse {
  readonly success: boolean;
  readonly data?: {
    readonly subscribers: readonly SubscriberRow[];
    readonly count: number;
  };
  readonly error?: string;
}

function isWithinDays(dateStr: string, days: number): boolean {
  try {
    const date = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return date >= cutoff;
  } catch {
    return false;
  }
}

export default function SubscribersDashboardPage() {
  const [subscribers, setSubscribers] = useState<readonly SubscriberRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await fetch("/api/admin/subscribers", { credentials: "include" });
        const data = (await res.json()) as SubscribersApiResponse;

        if (data.success && data.data) {
          setSubscribers(data.data.subscribers);
          setActiveCount(data.data.count);
        } else {
          setError(data.error ?? "Failed to load subscribers");
        }
      } catch {
        setError("Network error: could not load subscribers");
      } finally {
        setLoading(false);
      }
    };

    void fetchSubscribers();
  }, []);

  const newLast7Days = subscribers.filter((s) => isWithinDays(s.subscribedAt, 7)).length;
  const unsubscribedCount = subscribers.filter((s) => s.status === "unsubscribed").length;
  const totalMinusActive = subscribers.length - activeCount;
  const displayUnsubscribed = unsubscribedCount > 0 ? unsubscribedCount : totalMinusActive;

  const tableRows = subscribers.map((s) => ({
    id: s.id,
    email: s.email,
    status: s.status,
    createdAt: s.subscribedAt,
    unsubscribedAt: s.unsubscribedAt,
  }));

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl text-accent mb-6">Subscribers</h1>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-surface-elevated rounded-lg p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-surface border border-surface-elevated rounded-lg p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div>
        <h1 className="text-2xl text-accent mb-6">Subscribers</h1>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl text-accent mb-6">Subscribers</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-surface-elevated rounded-lg p-6">
          <p className="text-xs text-text-secondary uppercase mb-1">
            Total Active
          </p>
          <p className="text-2xl text-success">{activeCount}</p>
        </div>
        <div className="bg-surface border border-surface-elevated rounded-lg p-6">
          <p className="text-xs text-text-secondary uppercase mb-1">
            New (7d)
          </p>
          <p className="text-2xl text-accent">{newLast7Days}</p>
        </div>
        <div className="bg-surface border border-surface-elevated rounded-lg p-6">
          <p className="text-xs text-text-secondary uppercase mb-1">
            Unsubscribed
          </p>
          <p className="text-2xl text-text-secondary">{displayUnsubscribed}</p>
        </div>
      </div>

      {/* Subscriber Table */}
      <div className="bg-surface border border-surface-elevated rounded-lg p-6">
        <SubscriberTable subscribers={tableRows} />
      </div>
    </div>
  );
}
