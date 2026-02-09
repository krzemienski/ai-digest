"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TimeWindowPickerProps {
  readonly onDateRangeChange: (range: { start: string; end: string } | null) => void;
  readonly defaultPreset?: string;
}

interface ItemCountResponse {
  readonly success: boolean;
  readonly data?: {
    readonly itemCount: number;
    readonly sourceCount: number;
    readonly dateRange: {
      readonly start: string;
      readonly end: string;
    };
  };
  readonly error?: string;
}

type PresetKey = "24h" | "3d" | "7d" | "14d" | "custom";

const PRESETS: readonly { readonly key: PresetKey; readonly label: string; readonly hours: number | null }[] = [
  { key: "24h", label: "24 hours", hours: 24 },
  { key: "3d", label: "3 days", hours: 72 },
  { key: "7d", label: "7 days", hours: 168 },
  { key: "14d", label: "14 days", hours: 336 },
  { key: "custom", label: "Custom", hours: null },
];

function computeDateRange(hours: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(value: string): string {
  return new Date(value).toISOString();
}

export function TimeWindowPicker({ onDateRangeChange, defaultPreset = "7d" }: TimeWindowPickerProps) {
  const [activePreset, setActivePreset] = useState<PresetKey>(
    (PRESETS.find((p) => p.key === defaultPreset) ? defaultPreset : "7d") as PresetKey
  );

  // Custom date range state
  const defaultRange = computeDateRange(168); // 7 days for initial custom default
  const [customStart, setCustomStart] = useState(toLocalDatetimeValue(defaultRange.start));
  const [customEnd, setCustomEnd] = useState(toLocalDatetimeValue(defaultRange.end));

  // Item count fetch state
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [sourceCount, setSourceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCurrentRange = useCallback((): { start: string; end: string } | null => {
    if (activePreset === "custom") {
      try {
        const start = fromLocalDatetimeValue(customStart);
        const end = fromLocalDatetimeValue(customEnd);
        if (new Date(start) >= new Date(end)) return null;
        return { start, end };
      } catch {
        return null;
      }
    }

    const preset = PRESETS.find((p) => p.key === activePreset);
    if (!preset?.hours) return null;
    return computeDateRange(preset.hours);
  }, [activePreset, customStart, customEnd]);

  // Notify parent and fetch count whenever range changes
  useEffect(() => {
    const range = getCurrentRange();
    onDateRangeChange(range);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!range) {
      setItemCount(null);
      setSourceCount(null);
      setFetchError(null);
      return;
    }

    setLoading(true);
    setFetchError(null);

    debounceRef.current = setTimeout(() => {
      const fetchCount = async () => {
        try {
          const params = new URLSearchParams({
            start: range.start,
            end: range.end,
          });
          const res = await fetch(`/api/admin/podcast/item-count?${params.toString()}`, {
            credentials: "include",
          });
          const data = (await res.json()) as ItemCountResponse;

          if (data.success && data.data) {
            setItemCount(data.data.itemCount);
            setSourceCount(data.data.sourceCount);
            setFetchError(null);
          } else {
            setFetchError(data.error ?? "Failed to fetch item count");
            setItemCount(null);
            setSourceCount(null);
          }
        } catch {
          setFetchError("Network error fetching item count");
          setItemCount(null);
          setSourceCount(null);
        } finally {
          setLoading(false);
        }
      };
      void fetchCount();
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [activePreset, customStart, customEnd, getCurrentRange, onDateRangeChange]);

  const handlePresetClick = useCallback((key: PresetKey) => {
    setActivePreset(key);
  }, []);

  return (
    <div>
      <label className="block text-xs text-text-secondary uppercase mb-2">
        Content Time Window
      </label>

      {/* Preset Buttons */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((preset) => {
          const isSelected = activePreset === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetClick(preset.key)}
              className={`h-10 px-3 rounded border transition-all text-sm ${
                isSelected
                  ? "bg-accent text-bg border-accent font-medium"
                  : "bg-bg text-text-primary border-surface-elevated hover:border-accent"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Inputs */}
      {activePreset === "custom" && (
        <div className="mt-3 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-text-secondary mb-1">
              Start
            </label>
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm focus:outline-none focus:border-accent focus:transition-all"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-text-secondary mb-1">
              End
            </label>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm focus:outline-none focus:border-accent focus:transition-all"
            />
          </div>
        </div>
      )}

      {/* Item Count Display */}
      <div className="mt-2 text-sm min-h-[1.5rem]">
        {loading && (
          <span className="text-text-secondary animate-pulse">
            Checking available content...
          </span>
        )}
        {!loading && fetchError && (
          <span className="text-destructive">{fetchError}</span>
        )}
        {!loading && !fetchError && itemCount !== null && itemCount > 0 && sourceCount !== null && (
          <span className="text-text-secondary">
            ~{itemCount} item{itemCount !== 1 ? "s" : ""} from {sourceCount} source{sourceCount !== 1 ? "s" : ""} available
          </span>
        )}
        {!loading && !fetchError && itemCount === 0 && (
          <span className="text-amber-400">
            No items found in this range
          </span>
        )}
      </div>
    </div>
  );
}
