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
        <h2 className="font-mono text-lg text-cyber-cyan">Subscriber List</h2>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 h-8 text-xs font-mono font-medium border border-cyber-cyan text-cyber-cyan rounded hover:bg-cyber-cyan/10 hover:shadow-neon-cyan transition-all"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-cyber-overlay">
              <th className="text-left py-3 px-4 text-cyber-text-secondary uppercase text-xs">
                Email
              </th>
              <th className="text-left py-3 px-4 text-cyber-text-secondary uppercase text-xs">
                Status
              </th>
              <th className="text-left py-3 px-4 text-cyber-text-secondary uppercase text-xs">
                Subscribed Date
              </th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-cyber-text-secondary">
                  No subscribers yet
                </td>
              </tr>
            )}
            {subscribers.map((sub) => (
              <tr
                key={sub.id}
                className="border-b border-cyber-overlay/50 hover:bg-cyber-surface/50 transition-colors"
              >
                <td className="py-3 px-4 text-cyber-text">{sub.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider rounded ${
                      sub.status === "active"
                        ? "text-cyber-green border border-cyber-green"
                        : "text-cyber-text-secondary border border-cyber-overlay"
                    }`}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-cyber-text-secondary">
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
