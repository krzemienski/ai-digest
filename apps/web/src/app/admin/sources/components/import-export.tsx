"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ImportResult {
  readonly added: number;
  readonly skipped: number;
  readonly errors?: readonly string[];
}

interface BulkImportResponse {
  readonly success: boolean;
  readonly data?: ImportResult;
  readonly error?: string;
}

interface ImportExportProps {
  readonly onSourcesImported?: () => void;
}

export function ImportExport({ onSourcesImported }: ImportExportProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((text: string, type: "success" | "error") => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    setMessage(text);
    setMessageType(type);
    messageTimerRef.current = setTimeout(() => {
      setMessage(null);
      messageTimerRef.current = null;
    }, 5000);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/sources/export", {
        credentials: "include",
      });

      if (!res.ok) {
        showMessage("Export failed: server error", "error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sources-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      showMessage("Sources exported successfully", "success");
    } catch {
      showMessage("Export failed: network error", "error");
    } finally {
      setExporting(false);
    }
  }, [showMessage]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setImporting(true);
      try {
        const text = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          showMessage("Invalid JSON file", "error");
          setImporting(false);
          return;
        }

        if (!Array.isArray(parsed)) {
          showMessage("JSON must be an array of source objects", "error");
          setImporting(false);
          return;
        }

        const res = await fetch("/api/admin/sources/bulk", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });

        const data = (await res.json()) as BulkImportResponse;

        if (data.success && data.data) {
          const { added, skipped, errors } = data.data;
          const parts: string[] = [];
          if (added > 0) parts.push(`${added} added`);
          if (skipped > 0) parts.push(`${skipped} skipped`);
          if (errors && errors.length > 0) parts.push(`${errors.length} error(s)`);

          const summary = parts.length > 0 ? parts.join(", ") : "No changes";
          showMessage(summary, errors && errors.length > 0 ? "error" : "success");

          if (added > 0 && onSourcesImported) {
            onSourcesImported();
          }
        } else {
          showMessage(data.error ?? "Import failed", "error");
        }
      } catch {
        showMessage("Import failed: network error", "error");
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [showMessage, onSourcesImported]
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleFileSelected(file);
      }
    },
    [handleFileSelected]
  );

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleInputChange}
      />

      <Button
        variant="default"
        size="sm"
        disabled={importing}
        onClick={handleImportClick}
      >
        {importing ? "Importing..." : "Import"}
      </Button>

      <Button
        variant="default"
        size="sm"
        disabled={exporting}
        onClick={() => void handleExport()}
      >
        {exporting ? "Exporting..." : "Export"}
      </Button>

      {message && (
        <span
          className={`text-xs ml-2 transition-opacity ${
            messageType === "success"
              ? "text-accent"
              : "text-destructive"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
