"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    setLoading(true);
    document.cookie = `admin-token=${apiKey}; path=/; max-age=${60 * 60 * 24 * 7}`;
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-cyber-surface border border-cyber-overlay rounded-lg p-8">
        <h1 className="font-mono text-2xl text-cyber-cyan mb-8 text-center">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="api-key"
              className="font-mono text-sm text-cyber-text-secondary"
            >
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your admin API key"
              className="w-full bg-cyber-bg border border-cyber-overlay rounded px-4 py-3 font-mono text-sm text-cyber-text placeholder:text-cyber-text-secondary/50 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="font-mono text-sm text-cyber-magenta">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm py-3 rounded hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
