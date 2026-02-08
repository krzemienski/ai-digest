"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }

      router.push("/digests");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-cyber-surface border border-cyber-overlay rounded-lg p-8">
      <h1 className="text-2xl font-semibold text-cyber-text mb-2 text-center">
        Sign In
      </h1>
      <p className="text-sm text-cyber-text-secondary text-center mb-8">
        Welcome back to AI Digest
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-cyber-text-secondary">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-cyber-bg border border-cyber-overlay rounded-md px-4 py-2.5 text-sm text-cyber-text placeholder:text-cyber-text-secondary/50 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm text-cyber-text-secondary">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full bg-cyber-bg border border-cyber-overlay rounded-md px-4 py-2.5 text-sm text-cyber-text placeholder:text-cyber-text-secondary/50 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-cyber-overlay bg-cyber-bg"
          />
          <label htmlFor="remember" className="text-sm text-cyber-text-secondary">
            Remember me for 30 days
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyber-cyan text-cyber-bg font-medium text-sm py-2.5 rounded-md hover:bg-cyber-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-sm text-cyber-text-secondary text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-cyber-cyan hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
