"use client";

import { useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/audio-store";
import type { TranscriptSegment } from "@ai-digest/shared";

const SPEAKER_COLORS = [
  "text-cyber-cyan",
  "text-cyber-green",
  "text-cyber-magenta",
  "text-cyber-orange",
  "text-cyber-amber",
] as const;

function getSpeakerColorMap(segments: readonly TranscriptSegment[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  let colorIndex = 0;
  for (const segment of segments) {
    if (!colorMap.has(segment.speaker)) {
      colorMap.set(segment.speaker, SPEAKER_COLORS[colorIndex % SPEAKER_COLORS.length]!);
      colorIndex = colorIndex + 1;
    }
  }
  return colorMap;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-cyber-amber/30 text-cyber-text">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  searchQuery?: string;
}

export function TranscriptView({ segments, searchQuery = "" }: TranscriptViewProps) {
  const activeSegmentIndex = useAudioStore((s) => s.activeSegmentIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const speakerColors = getSpeakerColorMap(segments);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeSegmentIndex]);

  const handleTimestampClick = (startTime: number) => {
    useAudioStore.getState().seek(startTime);
  };

  return (
    <div ref={containerRef} className="mt-4 max-h-96 overflow-y-auto space-y-2 font-mono text-sm">
      {segments.map((segment, index) => {
        const isActive = index === activeSegmentIndex;
        const colorClass = speakerColors.get(segment.speaker) ?? "text-cyber-cyan";

        return (
          <div
            key={index}
            ref={isActive ? activeRef : undefined}
            className={`flex gap-3 p-2 rounded transition-colors ${
              isActive
                ? "bg-cyber-overlay/50 border-l-2 border-cyber-cyan"
                : "border-l-2 border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => handleTimestampClick(segment.startTime)}
              className="shrink-0 text-cyber-text-secondary hover:text-cyber-cyan transition-colors cursor-pointer"
            >
              {formatTimestamp(segment.startTime)}
            </button>
            <span className={`shrink-0 font-bold ${colorClass}`}>
              {segment.speaker}:
            </span>
            <span className="text-cyber-text">
              {highlightText(segment.text, searchQuery)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
