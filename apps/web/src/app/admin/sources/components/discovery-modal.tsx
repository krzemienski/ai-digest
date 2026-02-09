"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DiscoveryCandidate, DiscoveryStatus } from "@ai-digest/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscoveryModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSourcesAdded?: () => void;
}

interface DiscoveryRunData {
  readonly id: string;
  readonly status: DiscoveryStatus;
  readonly candidates: readonly DiscoveryCandidate[];
  readonly error: string | null;
}

type Phase = "configure" | "running" | "results" | "done";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE_TYPES = [
  { value: "rss", label: "RSS" },
  { value: "reddit", label: "Reddit" },
  { value: "github", label: "GitHub" },
  { value: "arxiv", label: "ArXiv" },
  { value: "hackernews", label: "HackerNews" },
  { value: "huggingface", label: "HuggingFace" },
  { value: "producthunt", label: "ProductHunt" },
] as const;

const POLL_INTERVAL_MS = 3000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialSelections(
  candidates: readonly DiscoveryCandidate[],
): ReadonlySet<number> {
  const selected = new Set<number>();
  candidates.forEach((c, i) => {
    if (c.validated && c.relevanceScore >= 70) {
      selected.add(i);
    }
  });
  return selected;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiscoveryModal({
  isOpen,
  onClose,
  onSourcesAdded,
}: DiscoveryModalProps) {
  // Config state
  const [topicsInput, setTopicsInput] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ReadonlySet<string>>(
    () => new Set(SOURCE_TYPES.map((s) => s.value)),
  );
  const [maxSources, setMaxSources] = useState(10);

  // Run state
  const [phase, setPhase] = useState<Phase>("configure");
  const [runId, setRunId] = useState<string | null>(null);
  const [progressLogs, setProgressLogs] = useState<readonly string[]>([]);
  const [candidates, setCandidates] = useState<readonly DiscoveryCandidate[]>(
    [],
  );
  const [runError, setRunError] = useState<string | null>(null);

  // Results state
  const [selections, setSelections] = useState<ReadonlySet<number>>(
    new Set<number>(),
  );
  const [addResult, setAddResult] = useState<{
    added: number;
    skipped: number;
  } | null>(null);
  const [adding, setAdding] = useState(false);

  // Refs
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------
  // Cleanup polling on unmount / close
  // ------------------------------------------
  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // ------------------------------------------
  // Reset when reopened
  // ------------------------------------------
  useEffect(() => {
    if (isOpen) {
      setPhase("configure");
      setRunId(null);
      setProgressLogs([]);
      setCandidates([]);
      setRunError(null);
      setSelections(new Set<number>());
      setAddResult(null);
      setAdding(false);
    }
  }, [isOpen]);

  // ------------------------------------------
  // Auto-scroll log container
  // ------------------------------------------
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [progressLogs]);

  // ------------------------------------------
  // Handlers
  // ------------------------------------------

  const handleTypeToggle = useCallback((value: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const handleMaxSourcesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        setMaxSources(Math.max(5, Math.min(50, val)));
      }
    },
    [],
  );

  const handleStart = useCallback(async () => {
    setRunError(null);
    setProgressLogs([]);

    const topics = topicsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const sourceTypes = Array.from(selectedTypes);

    try {
      setProgressLogs((prev) => [...prev, "Starting discovery run..."]);

      const res = await fetch("/api/admin/sources/discover", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: topics.length > 0 ? topics : undefined,
          sourceTypes: sourceTypes.length > 0 ? sourceTypes : undefined,
          maxSources,
        }),
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: { runId: string; status: string };
        error?: string;
      };

      if (!data.success || !data.data) {
        setRunError(data.error ?? "Failed to start discovery");
        return;
      }

      const newRunId = data.data.runId;
      setRunId(newRunId);
      setPhase("running");
      setProgressLogs((prev) => [
        ...prev,
        `Discovery run started (${newRunId.slice(0, 8)}...)`,
      ]);

      // Begin polling
      pollRef.current = setInterval(() => {
        void pollRun(newRunId);
      }, POLL_INTERVAL_MS);
    } catch {
      setRunError("Network error: could not reach server");
    }
  }, [topicsInput, selectedTypes, maxSources]);

  const pollRun = useCallback(async (id: string) => {
    try {
      const res = await fetch(
        `/api/admin/sources/discover?runId=${encodeURIComponent(id)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        success: boolean;
        data?: DiscoveryRunData;
        error?: string;
      };

      if (!data.success || !data.data) return;

      const run = data.data;

      if (run.status === "running") {
        setProgressLogs((prev) => {
          const last = prev[prev.length - 1];
          const msg = `Discovering sources... (${run.candidates.length} found so far)`;
          if (last === msg) return prev;
          return [...prev, msg];
        });
      }

      if (run.status === "completed") {
        stopPolling();
        const foundCandidates = run.candidates;
        setCandidates(foundCandidates);
        setSelections(buildInitialSelections(foundCandidates));
        setProgressLogs((prev) => [
          ...prev,
          `Discovery complete! Found ${foundCandidates.length} source candidates.`,
        ]);
        setPhase("results");
      }

      if (run.status === "failed") {
        stopPolling();
        setRunError(run.error ?? "Discovery run failed");
        setProgressLogs((prev) => [
          ...prev,
          `Discovery failed: ${run.error ?? "Unknown error"}`,
        ]);
        setPhase("configure");
      }
    } catch {
      // Silently retry on next poll
    }
  }, [stopPolling]);

  const handleCandidateToggle = useCallback((index: number) => {
    setSelections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelections(
      new Set(candidates.map((_, i) => i)),
    );
  }, [candidates]);

  const handleSelectNone = useCallback(() => {
    setSelections(new Set<number>());
  }, []);

  const handleAddSelected = useCallback(async () => {
    if (!runId || selections.size === 0) return;
    setAdding(true);
    setRunError(null);

    try {
      const res = await fetch("/api/admin/sources/discover/add", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          candidateIndices: Array.from(selections),
        }),
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: { added: number; skipped: number };
        error?: string;
      };

      if (!data.success || !data.data) {
        setRunError(data.error ?? "Failed to add sources");
        return;
      }

      setAddResult(data.data);
      setPhase("done");
      onSourcesAdded?.();
    } catch {
      setRunError("Network error: could not reach server");
    } finally {
      setAdding(false);
    }
  }, [runId, selections, onSourcesAdded]);

  const handleClose = useCallback(() => {
    stopPolling();
    onClose();
  }, [stopPolling, onClose]);

  // ------------------------------------------
  // Render
  // ------------------------------------------

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-elevated rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-elevated shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-accent text-lg">
              {/* Sparkle icon (SVG) */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
              </svg>
            </span>
            <h2 className="text-lg text-accent">AI Source Discovery</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* ---- Configuration Section ---- */}
          {phase === "configure" && (
            <div className="space-y-4">
              {/* Topics */}
              <div>
                <label className="block text-xs text-text-secondary uppercase mb-1">
                  Topics (comma-separated)
                </label>
                <Input
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="e.g., robotics, autonomous vehicles"
                />
              </div>

              {/* Source Types */}
              <div>
                <label className="block text-xs text-text-secondary uppercase mb-2">
                  Source Types
                </label>
                <div className="flex flex-wrap gap-3">
                  {SOURCE_TYPES.map((st) => (
                    <label
                      key={st.value}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.has(st.value)}
                        onChange={() => handleTypeToggle(st.value)}
                        className="accent-accent w-4 h-4"
                      />
                      <span className="text-sm text-text-primary">
                        {st.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max Sources */}
              <div>
                <label className="block text-xs text-text-secondary uppercase mb-1">
                  Max Sources (5-50)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={maxSources}
                  onChange={handleMaxSourcesChange}
                  className="w-32"
                />
              </div>

              {/* Error */}
              {runError !== null && (
                <p className="text-sm text-destructive">{runError}</p>
              )}
            </div>
          )}

          {/* ---- Progress Section ---- */}
          {phase === "running" && (
            <div className="space-y-4">
              {/* Spinner + status */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-accent">Discovering...</span>
              </div>

              {/* Log area */}
              <div
                ref={logContainerRef}
                className="bg-bg border border-surface-elevated rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs space-y-1"
              >
                {progressLogs.map((log, i) => (
                  <div key={i} className="text-text-secondary">
                    <span className="text-text-secondary/50 mr-2">
                      [{String(i + 1).padStart(2, "0")}]
                    </span>
                    {log}
                  </div>
                ))}
              </div>

              {/* Error */}
              {runError !== null && (
                <p className="text-sm text-destructive">{runError}</p>
              )}
            </div>
          )}

          {/* ---- Results Section ---- */}
          {phase === "results" && (
            <div className="space-y-4">
              {/* Progress logs (collapsed) */}
              <details className="text-xs">
                <summary className="text-text-secondary cursor-pointer hover:text-text-primary">
                  Discovery log ({progressLogs.length} entries)
                </summary>
                <div className="bg-bg border border-surface-elevated rounded-lg p-3 mt-2 max-h-32 overflow-y-auto font-mono space-y-1">
                  {progressLogs.map((log, i) => (
                    <div key={i} className="text-text-secondary">
                      {log}
                    </div>
                  ))}
                </div>
              </details>

              {/* Summary */}
              <div className="text-sm text-text-secondary">
                Found{" "}
                <span className="text-accent font-medium">
                  {candidates.length}
                </span>{" "}
                source candidates.{" "}
                <span className="text-text-secondary/70">
                  ({selections.size} selected)
                </span>
              </div>

              {/* Select all / none */}
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-accent hover:underline"
                >
                  Select All
                </button>
                <span className="text-text-secondary/30">|</span>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="text-accent hover:underline"
                >
                  Select None
                </button>
              </div>

              {/* Candidates table */}
              {candidates.length > 0 && (
                <div className="border border-surface-elevated rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-elevated/50 text-xs text-text-secondary uppercase">
                          <th className="px-3 py-2 text-left w-10">&nbsp;</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">URL</th>
                          <th className="px-3 py-2 text-center">Score</th>
                          <th className="px-3 py-2 text-center">Valid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-elevated/30">
                        {candidates.map((c, i) => (
                          <tr
                            key={i}
                            className="hover:bg-surface-elevated/20 transition-colors"
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selections.has(i)}
                                onChange={() => handleCandidateToggle(i)}
                                className="accent-accent w-4 h-4"
                              />
                            </td>
                            <td className="px-3 py-2 text-text-primary font-medium">
                              <div>{c.name}</div>
                              {c.description && (
                                <div className="text-xs text-text-secondary/70 truncate max-w-[200px]">
                                  {c.description}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/30">
                                {c.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-text-secondary text-xs truncate max-w-[180px]">
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-accent hover:underline"
                              >
                                {c.url}
                              </a>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  c.relevanceScore >= 80
                                    ? "text-green-400"
                                    : c.relevanceScore >= 60
                                      ? "text-yellow-400"
                                      : "text-text-secondary"
                                }`}
                              >
                                {c.relevanceScore}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {c.validated ? (
                                <span className="text-green-400">
                                  &#10003;
                                </span>
                              ) : (
                                <span className="text-text-secondary/40">
                                  &#10007;
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error */}
              {runError !== null && (
                <p className="text-sm text-destructive">{runError}</p>
              )}
            </div>
          )}

          {/* ---- Done Section ---- */}
          {phase === "done" && addResult !== null && (
            <div className="space-y-4 text-center py-6">
              <div className="text-green-400 text-4xl">&#10003;</div>
              <div className="text-lg text-text-primary">
                Added{" "}
                <span className="text-accent font-bold">
                  {addResult.added}
                </span>{" "}
                sources
                {addResult.skipped > 0 && (
                  <span className="text-text-secondary">
                    , {addResult.skipped} skipped
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                The new sources are now available in your sources list.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-elevated shrink-0">
          {phase === "configure" && (
            <>
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleStart()}
              >
                Start Discovery
              </Button>
            </>
          )}

          {phase === "running" && (
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {phase === "results" && (
            <>
              <Button variant="default" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="primary"
                disabled={selections.size === 0 || adding}
                onClick={() => void handleAddSelected()}
              >
                {adding
                  ? "Adding..."
                  : `Add Selected (${selections.size})`}
              </Button>
            </>
          )}

          {phase === "done" && (
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
