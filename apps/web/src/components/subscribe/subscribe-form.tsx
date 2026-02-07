"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (data.success) {
        setStatus("success");
        setMessage("Welcome! You've been subscribed.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Subscription failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Subscription failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status !== "idle" && status !== "loading") {
            setStatus("idle");
            setMessage("");
          }
        }}
        placeholder="you@example.com"
        className="bg-cyber-surface border border-cyber-overlay rounded px-3 py-2 text-cyber-text font-mono text-sm focus:outline-none focus:border-cyber-cyan flex-1"
        disabled={status === "loading"}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-cyber-cyan text-cyber-bg font-mono font-bold px-6 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </button>
      {status === "success" && (
        <p className="text-cyber-green text-sm font-mono self-center">{message}</p>
      )}
      {status === "error" && (
        <p className="text-cyber-magenta text-sm font-mono self-center">{message}</p>
      )}
    </form>
  );
}
