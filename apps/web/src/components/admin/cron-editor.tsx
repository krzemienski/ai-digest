"use client";

import { useMemo } from "react";

interface CronEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

function parseCronToHumanReadable(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return `Custom schedule: ${expression}`;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts as [string, string, string, string, string];

  // Every N hours: "0 */N * * *"
  if (minute === "0" && hour.startsWith("*/") && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const interval = hour.slice(2);
    return `Every ${interval} hours`;
  }

  // Every N minutes: "*/N * * * *"
  if (minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const interval = minute.slice(2);
    return `Every ${interval} minutes`;
  }

  // Specific time patterns
  if (dayOfMonth === "*" && month === "*") {
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);

    if (isNaN(hourNum) || isNaN(minuteNum)) {
      return `Custom schedule: ${expression}`;
    }

    const period = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const displayMinute = minuteNum.toString().padStart(2, "0");
    const timeStr = `${displayHour}:${displayMinute} ${period}`;

    // Every day: "M H * * *"
    if (dayOfWeek === "*") {
      return `Every day at ${timeStr}`;
    }

    // Weekdays: "M H * * 1-5"
    if (dayOfWeek === "1-5") {
      return `Weekdays at ${timeStr}`;
    }

    // Weekends: "M H * * 0,6" or "M H * * 6,0"
    if (dayOfWeek === "0,6" || dayOfWeek === "6,0") {
      return `Weekends at ${timeStr}`;
    }

    // Specific days
    const dayNames: Record<string, string> = {
      "0": "Sunday",
      "1": "Monday",
      "2": "Tuesday",
      "3": "Wednesday",
      "4": "Thursday",
      "5": "Friday",
      "6": "Saturday",
    };

    const dayLabel = dayNames[dayOfWeek];
    if (dayLabel) {
      return `${dayLabel}s at ${timeStr}`;
    }
  }

  return `Custom schedule: ${expression}`;
}

export function CronEditor({ value, onChange }: CronEditorProps) {
  const description = useMemo(() => parseCronToHumanReadable(value), [value]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 8 * * *"
        className="w-full h-10 px-3 bg-surface border border-surface-elevated text-text-primary text-sm placeholder:text-text-secondary/50 rounded focus:outline-none focus:border-accent focus:transition-all"
      />
      <p className="text-sm text-text-secondary">
        {description}
      </p>
    </div>
  );
}
