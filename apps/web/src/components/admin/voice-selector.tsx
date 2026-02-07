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
      <label className="block font-mono text-sm text-cyber-text-secondary mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Enter ElevenLabs voice ID..."
        className="w-full h-10 px-3 bg-cyber-surface border border-cyber-overlay text-cyber-text font-mono text-sm placeholder:text-cyber-text-secondary/50 rounded focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all"
      />
    </div>
  );
}
