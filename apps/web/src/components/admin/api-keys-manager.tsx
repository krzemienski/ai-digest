"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MaskedKeysResponse {
  readonly success: boolean;
  readonly data?: {
    readonly anthropic: string | null;
    readonly elevenlabs: string | null;
  };
  readonly error?: string;
}

interface SaveKeyResponse {
  readonly success: boolean;
  readonly provider?: string;
  readonly masked?: string;
  readonly error?: string;
}

interface TestKeyResponse {
  readonly valid: boolean;
  readonly error?: string;
}

type Provider = "anthropic" | "elevenlabs";

interface ProviderConfig {
  readonly id: Provider;
  readonly name: string;
  readonly description: string;
  readonly placeholder: string;
}

const PROVIDERS: readonly ProviderConfig[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Required for AI podcast script generation",
    placeholder: "sk-ant-...",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Required for text-to-speech audio synthesis",
    placeholder: "sk_...",
  },
];

interface KeyFieldState {
  readonly inputValue: string;
  readonly showInput: boolean;
  readonly testing: boolean;
  readonly saving: boolean;
  readonly testResult: { readonly valid: boolean; readonly error?: string } | null;
  readonly saveResult: { readonly success: boolean; readonly error?: string } | null;
}

const INITIAL_KEY_STATE: KeyFieldState = {
  inputValue: "",
  showInput: false,
  testing: false,
  saving: false,
  testResult: null,
  saveResult: null,
};

export function ApiKeysManager() {
  const [maskedKeys, setMaskedKeys] = useState<Record<Provider, string | null>>({
    anthropic: null,
    elevenlabs: null,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldStates, setFieldStates] = useState<Record<Provider, KeyFieldState>>({
    anthropic: INITIAL_KEY_STATE,
    elevenlabs: INITIAL_KEY_STATE,
  });

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch("/api/admin/config/api-keys", { credentials: "include" });
        const data = (await res.json()) as MaskedKeysResponse;

        if (data.success && data.data) {
          setMaskedKeys({
            anthropic: data.data.anthropic ?? null,
            elevenlabs: data.data.elevenlabs ?? null,
          });
        } else {
          setLoadError(data.error ?? "Failed to load API keys");
        }
      } catch {
        setLoadError("Network error: could not load API keys");
      } finally {
        setLoading(false);
      }
    };

    void fetchKeys();
  }, []);

  const updateFieldState = useCallback(
    (provider: Provider, update: Partial<KeyFieldState>) => {
      setFieldStates((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], ...update },
      }));
    },
    []
  );

  const handleTest = useCallback(
    async (provider: Provider) => {
      const key = fieldStates[provider].inputValue.trim();
      if (key.length === 0) return;

      updateFieldState(provider, { testing: true, testResult: null, saveResult: null });

      try {
        const res = await fetch("/api/admin/config/api-keys/test", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, key }),
        });
        const data = (await res.json()) as TestKeyResponse;
        updateFieldState(provider, {
          testing: false,
          testResult: { valid: data.valid, error: data.error },
        });
      } catch {
        updateFieldState(provider, {
          testing: false,
          testResult: { valid: false, error: "Network error" },
        });
      }
    },
    [fieldStates, updateFieldState]
  );

  const handleSave = useCallback(
    async (provider: Provider) => {
      const key = fieldStates[provider].inputValue.trim();
      if (key.length === 0) return;

      updateFieldState(provider, { saving: true, saveResult: null });

      try {
        const res = await fetch("/api/admin/config/api-keys", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, key }),
        });
        const data = (await res.json()) as SaveKeyResponse;

        if (data.success && data.masked) {
          setMaskedKeys((prev) => ({ ...prev, [provider]: data.masked ?? null }));
          updateFieldState(provider, {
            saving: false,
            inputValue: "",
            showInput: false,
            testResult: null,
            saveResult: { success: true },
          });
        } else {
          updateFieldState(provider, {
            saving: false,
            saveResult: {
              success: false,
              error: data.error ?? "Failed to save key. Ensure API_KEY_ENCRYPTION_SECRET is configured on the server.",
            },
          });
        }
      } catch {
        updateFieldState(provider, {
          saving: false,
          saveResult: {
            success: false,
            error: "Network error: could not save key",
          },
        });
      }
    },
    [fieldStates, updateFieldState]
  );

  if (loading) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-lg p-6 animate-pulse">
        <div className="h-5 w-28 bg-surface-elevated rounded mb-4" />
        <div className="space-y-4">
          <div className="h-20 w-full bg-surface-elevated rounded" />
          <div className="h-20 w-full bg-surface-elevated rounded" />
        </div>
      </div>
    );
  }

  if (loadError !== null) {
    return (
      <div className="bg-surface border border-surface-elevated rounded-lg p-6">
        <h2 className="text-lg text-accent mb-4">API Keys</h2>
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <section className="bg-surface border border-surface-elevated rounded-lg p-6">
      <h2 className="text-lg text-accent mb-2">API Keys</h2>
      <p className="text-xs text-text-secondary mb-6">
        Manage external service credentials. Keys are encrypted at rest.
      </p>

      <div className="space-y-6">
        {PROVIDERS.map((providerConfig) => {
          const state = fieldStates[providerConfig.id];
          const masked = maskedKeys[providerConfig.id];

          return (
            <div
              key={providerConfig.id}
              className="border border-surface-elevated rounded-lg p-4"
            >
              {/* Provider header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    {providerConfig.name}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {providerConfig.description}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    masked !== null
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-surface-elevated text-text-muted border border-surface-elevated"
                  }`}
                >
                  {masked !== null ? masked : "Not configured"}
                </span>
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={state.showInput ? "text" : "password"}
                    value={state.inputValue}
                    onChange={(e) =>
                      updateFieldState(providerConfig.id, {
                        inputValue: e.target.value,
                        testResult: null,
                        saveResult: null,
                      })
                    }
                    placeholder={providerConfig.placeholder}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateFieldState(providerConfig.id, {
                        showInput: !state.showInput,
                      })
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs px-1.5 py-0.5 rounded transition-colors"
                    aria-label={state.showInput ? "Hide key" : "Show key"}
                  >
                    {state.showInput ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  disabled={state.inputValue.trim().length === 0 || state.testing}
                  onClick={() => void handleTest(providerConfig.id)}
                >
                  {state.testing ? "Testing..." : "Test"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={state.inputValue.trim().length === 0 || state.saving}
                  onClick={() => void handleSave(providerConfig.id)}
                >
                  {state.saving ? "Saving..." : "Save"}
                </Button>
              </div>

              {/* Test result */}
              {state.testResult !== null && (
                <p
                  className={`text-xs mt-2 ${
                    state.testResult.valid ? "text-success" : "text-destructive"
                  }`}
                >
                  {state.testResult.valid
                    ? "Valid - key authenticated successfully"
                    : `Invalid: ${state.testResult.error ?? "unknown error"}`}
                </p>
              )}

              {/* Save result */}
              {state.saveResult !== null && (
                <p
                  className={`text-xs mt-2 ${
                    state.saveResult.success ? "text-success" : "text-destructive"
                  }`}
                >
                  {state.saveResult.success
                    ? "Key saved and encrypted successfully"
                    : state.saveResult.error ?? "Failed to save key"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
