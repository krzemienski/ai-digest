"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

interface UnsubscribeConfirmProps {
  email: string;
}

export function UnsubscribeConfirm({ email }: UnsubscribeConfirmProps) {
  const [status, setStatus] = useState<Status>("idle");

  const handleConfirm = async () => {
    setStatus("loading");

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json() as { success: boolean };

      if (data.success) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="text-center py-12">
        <p className="text-success text-lg">
          You&apos;ve been unsubscribed. We&apos;re sorry to see you go.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg">
          Failed to unsubscribe. Please try again.
        </p>
        <button
          onClick={handleConfirm}
          className="mt-4 bg-accent text-bg font-bold px-6 py-2 rounded hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-text-primary text-lg mb-6">
        Are you sure you want to unsubscribe <span className="text-accent">{email}</span>?
      </p>
      <button
        onClick={handleConfirm}
        disabled={status === "loading"}
        className="bg-destructive text-text-primary font-bold px-6 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "loading" ? "Processing..." : "Confirm Unsubscribe"}
      </button>
    </div>
  );
}
