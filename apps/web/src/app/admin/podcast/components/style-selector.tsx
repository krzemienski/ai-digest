"use client";

import { useState, useCallback } from "react";
import type { PodcastStyle } from "@ai-digest/shared";

interface StyleSelectorProps {
  readonly value: PodcastStyle;
  readonly customPrompt: string;
  readonly onChange: (style: PodcastStyle, customPrompt: string) => void;
  readonly disabled?: boolean;
}

const STYLE_OPTIONS: readonly {
  readonly value: PodcastStyle;
  readonly label: string;
  readonly description: string;
  readonly template: string | null;
}[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Polished, authoritative tone with precise industry terminology",
    template: "Maintain a polished, authoritative tone. Use industry terminology precisely. Structure discussions with clear thesis statements and supporting evidence.",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Relaxed, approachable with humor and relatable analogies",
    template: "Keep the conversation relaxed and approachable. Use everyday language, occasional humor, and relatable analogies. Feel free to express genuine reactions and personal opinions.",
  },
  {
    value: "technical",
    label: "Technical Deep-Dive",
    description: "Detailed implementation specifics for an engineering audience",
    template: "Dive deep into technical details. Discuss implementation specifics, trade-offs, and architectural decisions. Assume the audience has an engineering background.",
  },
  {
    value: "news_brief",
    label: "News Brief",
    description: "Concise and punchy with maximum information density",
    template: "Be concise and punchy. Lead with the most impactful news. Keep segments short (30-60 seconds each). Focus on facts over analysis. Deliver maximum information density.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Write your own style instructions",
    template: null,
  },
];

const DEFAULT_CUSTOM_PROMPT =
  "Maintain a polished, authoritative tone. Use industry terminology precisely. Structure discussions with clear thesis statements and supporting evidence.";

export function StyleSelector({
  value,
  customPrompt,
  onChange,
  disabled,
}: StyleSelectorProps) {
  const [localCustom, setLocalCustom] = useState(
    customPrompt || DEFAULT_CUSTOM_PROMPT
  );

  const handleStyleChange = useCallback(
    (style: PodcastStyle) => {
      onChange(style, style === "custom" ? localCustom : "");
    },
    [onChange, localCustom]
  );

  const handleCustomChange = useCallback(
    (text: string) => {
      setLocalCustom(text);
      onChange("custom", text);
    },
    [onChange]
  );

  return (
    <div>
      <label className="block text-xs text-text-secondary uppercase mb-2">
        Podcast Style
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {STYLE_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => handleStyleChange(opt.value)}
              className={`flex flex-col items-start p-3 rounded border transition-all text-left ${
                isSelected
                  ? "bg-accent/10 border-accent"
                  : "bg-bg border-surface-elevated hover:border-accent/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-sm font-medium text-text-primary">
                {opt.label}
              </span>
              <span className="text-xs text-text-secondary mt-1 line-clamp-2">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show template text for selected preset */}
      {value !== "custom" && (() => {
        const selected = STYLE_OPTIONS.find((o) => o.value === value);
        return selected?.template ? (
          <div className="mt-2 bg-bg border border-surface-elevated rounded p-3">
            <div className="text-[10px] text-text-secondary uppercase mb-1">
              AI Prompt Template
            </div>
            <p className="text-xs text-text-primary/80 italic leading-relaxed">
              &ldquo;{selected.template}&rdquo;
            </p>
          </div>
        ) : null;
      })()}

      {value === "custom" && (
        <div className="mt-3">
          <label className="block text-xs text-text-secondary mb-1">
            Custom Style Instructions
          </label>
          <textarea
            value={localCustom}
            onChange={(e) => handleCustomChange(e.target.value)}
            disabled={disabled}
            rows={4}
            maxLength={2000}
            placeholder="Describe the tone, style, and format you want..."
            className="w-full px-3 py-2 bg-bg border border-surface-elevated rounded text-text-primary text-sm placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:transition-all disabled:opacity-50 resize-y"
          />
          <div className="text-xs text-text-secondary text-right mt-1">
            {localCustom.length}/2000
          </div>
        </div>
      )}
    </div>
  );
}
