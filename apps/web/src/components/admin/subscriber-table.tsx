"use client";

import { useCallback } from "react";

interface SubscriberRow {
  readonly id: string;
  readonly email: string;
  readonly status: string;
  readonly createdAt: string;
  readonly unsubscribedAt?: string | null;
}

interface SubscriberTableProps {
  readonly subscribers: readonly SubscriberRow[];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function buildCsvContent(rows: readonly SubscriberRow[]): string {
  const header = "email,status,date";
  const lines = rows.map(
    (row) => `${row.email},${row.status},${formatDate(row.createdAt)}`
  );
  return [header, ...lines].join("\n");
}

export function SubscriberTable({ subscribers }: SubscriberTableProps) {
  const handleExport = useCallback(() => {
    const csv = buildCsvContent(subscribers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "subscribers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [subscribers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-accent">Subscriber List</h2>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 h-8 text-xs font-medium border border-accent text-accent rounded hover:bg-accent/10 hover:transition-all"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-surface-elevated">
              <th className="text-left py-3 px-4 text-text-secondary uppercase text-xs">
                Email
              </th>
              <th className="text-left py-3 px-4 text-text-secondary uppercase text-xs">
                Status
              </th>
              <th className="text-left py-3 px-4 text-text-secondary uppercase text-xs">
                Subscribed Date
              </th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-text-secondary">
                  No subscribers yet
                </td>
              </tr>
            )}
            {subscribers.map((sub) => (
              <tr
                key={sub.id}
                className="border-b border-surface-elevated/50 hover:bg-surface/50 transition-colors"
              >
                <td className="py-3 px-4 text-text-primary">{sub.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${
                      sub.status === "active"
                        ? "text-success border border-success"
                        : "text-text-secondary border border-surface-elevated"
                    }`}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-text-secondary">
                  {formatDate(sub.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
