"use client";

import { useCallback } from "react";

interface VoiceSelectorProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function VoiceSelector({ label, value, onChange }: VoiceSelectorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div>
      <label className="block text-sm text-text-secondary mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Enter ElevenLabs voice ID..."
        className="w-full h-10 px-3 bg-surface border border-surface-elevated text-text-primary text-sm placeholder:text-text-secondary/50 rounded focus:outline-none focus:border-accent focus:transition-all"
      />
    </div>
  );
}
