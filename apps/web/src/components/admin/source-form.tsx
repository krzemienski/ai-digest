"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SOURCE_TYPES = [
  "rss",
  "github",
  "arxiv",
  "hackernews",
  "huggingface",
  "reddit",
  "producthunt",
] as const;

type SourceType = (typeof SOURCE_TYPES)[number];

interface SourceData {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly config: Record<string, unknown>;
  readonly enabled: boolean;
}

interface SourceFormProps {
  readonly source?: SourceData | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

function configPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    rss: '{ "url": "https://example.com/feed.xml" }',
    github: '{ "query": "topic:ai", "minStars": 100 }',
    arxiv: '{ "categories": ["cs.AI", "cs.LG"], "maxResults": 50 }',
    hackernews: '{ "keywords": ["AI", "LLM"], "minPoints": 50 }',
    huggingface: '{ "tasks": ["text-generation"], "minDownloads": 1000 }',
    reddit: '{ "subreddits": ["MachineLearning", "artificial"] }',
    producthunt: '{ "topic": "artificial-intelligence" }',
  };
  return placeholders[type] ?? "{}";
}

export function SourceForm({ source, onClose, onSaved }: SourceFormProps) {
  const isEditing = source !== null && source !== undefined;

  const [type, setType] = useState<SourceType>(
    (isEditing ? source.type : "rss") as SourceType
  );
  const [name, setName] = useState(isEditing ? source.name : "");
  const [configText, setConfigText] = useState(
    isEditing ? JSON.stringify(source.config, null, 2) : ""
  );
  const [enabled, setEnabled] = useState(isEditing ? source.enabled : true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = configText.trim()
        ? (JSON.parse(configText) as Record<string, unknown>)
        : {};
    } catch {
      setError("Config must be valid JSON");
      return;
    }

    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/sources/${source.id}`
        : "/api/admin/sources";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: name.trim(),
          config: parsedConfig,
          enabled,
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (!data.success) {
        setError(data.error ?? "Failed to save source");
        return;
      }

      onSaved();
    } catch {
      setError("Network error: could not reach server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-cyber-surface border border-cyber-overlay rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-mono text-lg text-cyber-cyan mb-4">
          {isEditing ? "Edit Source" : "Add Source"}
        </h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SourceType)}
              disabled={isEditing}
              className="w-full h-10 px-3 bg-cyber-bg border border-cyber-overlay rounded text-cyber-text font-mono text-sm focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all disabled:opacity-50"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My RSS Feed"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-cyber-text-secondary uppercase mb-1">
              Config (JSON)
            </label>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder={configPlaceholder(type)}
              rows={5}
              className="w-full px-3 py-2 bg-cyber-bg border border-cyber-overlay rounded text-cyber-text font-mono text-sm placeholder:text-cyber-text-secondary/50 focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all resize-y"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="accent-cyber-cyan w-4 h-4"
              />
              <span className="font-mono text-sm text-cyber-text">Enabled</span>
            </label>
          </div>

          {error !== null && (
            <p className="font-mono text-sm text-cyber-magenta">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="default" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
