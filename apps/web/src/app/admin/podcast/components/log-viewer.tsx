"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { StreamLogEntry } from "../hooks/use-log-stream";
import type { PodcastStage, LogSeverity } from "@ai-digest/shared";

interface LogViewerProps {
  readonly logs: readonly StreamLogEntry[];
  readonly maxHeight?: string;
}

const STAGE_COLORS: Record<PodcastStage, string> = {
  content_select: "#06b6d4",
  script_gen: "#8b5cf6",
  quality_review: "#f59e0b",
  tts: "#10b981",
  assembly: "#3b82f6",
  upload: "#ec4899",
};

const STAGE_LABELS: Record<PodcastStage, string> = {
  content_select: "Content",
  script_gen: "Script",
  quality_review: "Review",
  tts: "TTS",
  assembly: "Assembly",
  upload: "Upload",
};

const SEVERITY_CLASSES: Record<LogSeverity, string> = {
  info: "text-text-primary",
  warn: "text-yellow-400",
  error: "text-destructive",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function hasExpandableContent(metadata: Record<string, unknown> | null): boolean {
  if (!metadata) return false;
  return (
    "systemPrompt" in metadata ||
    "userPrompt" in metadata ||
    "segments" in metadata ||
    "script" in metadata
  );
}

function LogEntryRow({ entry }: { readonly entry: StreamLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const expandable = hasExpandableContent(entry.metadata);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className="px-3 py-1.5 hover:bg-surface-elevated/30 transition-colors">
      <div className="flex items-start gap-2 font-mono text-xs">
        {/* Timestamp */}
        <span className="text-text-secondary/60 shrink-0">
          {formatTimestamp(entry.createdAt)}
        </span>

        {/* Stage Badge */}
        <span
          className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{
            color: STAGE_COLORS[entry.stage],
            backgroundColor: `${STAGE_COLORS[entry.stage]}15`,
            border: `1px solid ${STAGE_COLORS[entry.stage]}40`,
          }}
        >
          {STAGE_LABELS[entry.stage]}
        </span>

        {/* Severity + Message */}
        <span className={`flex-1 ${SEVERITY_CLASSES[entry.severity]}`}>
          {entry.severity !== "info" && (
            <span
              className={`mr-1 font-bold uppercase ${
                entry.severity === "warn" ? "text-yellow-400" : "text-destructive"
              }`}
            >
              [{entry.severity}]
            </span>
          )}
          {entry.message}
          {expandable && (
            <button
              type="button"
              onClick={handleToggle}
              className="ml-2 text-accent/70 hover:text-accent underline"
            >
              {expanded ? "collapse" : "expand"}
            </button>
          )}
        </span>
      </div>

      {/* Expandable Content */}
      {expanded && entry.metadata && (
        <div className="mt-1 ml-[88px] space-y-1">
          {"systemPrompt" in entry.metadata && (
            <div className="p-2 bg-bg rounded border border-surface-elevated">
              <div className="text-[10px] text-text-secondary uppercase mb-1">
                System Prompt
              </div>
              <pre className="text-xs text-text-primary whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {String(entry.metadata["systemPrompt"])}
              </pre>
            </div>
          )}
          {"userPrompt" in entry.metadata && (
            <div className="p-2 bg-bg rounded border border-surface-elevated">
              <div className="text-[10px] text-text-secondary uppercase mb-1">
                User Prompt
              </div>
              <pre className="text-xs text-text-primary whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {String(entry.metadata["userPrompt"])}
              </pre>
            </div>
          )}
          {"segments" in entry.metadata && (
            <div className="p-2 bg-bg rounded border border-surface-elevated">
              <div className="text-[10px] text-text-secondary uppercase mb-1">
                Segments
              </div>
              <pre className="text-xs text-text-primary whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {JSON.stringify(entry.metadata["segments"], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LogViewer({ logs, maxHeight = "400px" }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive (unless user scrolled up)
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect user scroll
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
  }, []);

  if (logs.length === 0) {
    return (
      <div className="bg-bg border border-surface-elevated rounded-lg p-6 text-center text-sm text-text-secondary">
        Waiting for logs...
      </div>
    );
  }

  return (
    <div className="bg-bg border border-surface-elevated rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-elevated">
        <span className="text-xs text-text-secondary uppercase">
          Pipeline Logs ({logs.length})
        </span>
        {!autoScroll && (
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true);
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }}
            className="text-xs text-accent hover:underline"
          >
            Scroll to bottom
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto divide-y divide-surface-elevated/30"
        style={{ maxHeight }}
      >
        {logs.map((entry, index) => (
          <LogEntryRow key={`${entry.createdAt}-${index}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}
