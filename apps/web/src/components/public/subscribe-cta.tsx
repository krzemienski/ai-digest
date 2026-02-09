"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function SubscribeCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div id="subscribe" className="py-16 sm:py-24 text-center">
        <p className="text-lg text-pub-green">Check your inbox! 🎉</p>
      </div>
    );
  }

  return (
    <div id="subscribe" className="py-16 sm:py-24 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-pub-text leading-tight">
        AI news you can listen to.{" "}
        <span className="text-pub-red">Weekly.</span>
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex items-center justify-center gap-3 max-w-md mx-auto px-4"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="flex-1 bg-pub-surface border border-pub-border text-pub-text text-sm px-4 py-3 placeholder:text-pub-text-muted focus:outline-none focus:border-pub-blue transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-pub-red hover:bg-pub-red-hover text-white text-sm font-medium px-6 py-3 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      <p className="mt-4 text-xs text-pub-text-muted">
        Join 1,000+ AI professionals
      </p>
    </div>
  );
}
