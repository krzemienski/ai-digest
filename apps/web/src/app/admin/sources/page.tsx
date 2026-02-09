"use client";

import { useState, useCallback } from "react";
import { SourceTable } from "@/components/admin/source-table";
import { SourceForm } from "@/components/admin/source-form";
import { ImportExport } from "./components/import-export";
import { DiscoveryModal } from "./components/discovery-modal";
import { Button } from "@/components/ui/button";

interface SourceData {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly config: Record<string, unknown>;
  readonly enabled: boolean;
  readonly consecutiveErrors: number;
  readonly lastFetchAt: string | null;
  readonly lastFetchError: string | null;
}

export default function AdminSourcesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const handleEdit = useCallback((source: SourceData) => {
    setEditingSource(source);
    setShowForm(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingSource(null);
    setShowForm(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowForm(false);
    setEditingSource(null);
  }, []);

  const handleSaved = useCallback(() => {
    setShowForm(false);
    setEditingSource(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleSourcesImported = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleOpenDiscovery = useCallback(() => {
    setShowDiscovery(true);
  }, []);

  const handleCloseDiscovery = useCallback(() => {
    setShowDiscovery(false);
  }, []);

  const handleSourcesDiscovered = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-accent">Sources</h1>
        <div className="flex items-center gap-3">
          <Button variant="default" onClick={handleOpenDiscovery}>
            <span className="flex items-center gap-1.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
              </svg>
              Discover Sources
            </span>
          </Button>
          <ImportExport onSourcesImported={handleSourcesImported} />
          <Button variant="primary" onClick={handleAdd}>
            Add Source
          </Button>
        </div>
      </div>

      <SourceTable key={refreshKey} onEdit={handleEdit} />

      {showForm && (
        <SourceForm
          source={editingSource}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      <DiscoveryModal
        isOpen={showDiscovery}
        onClose={handleCloseDiscovery}
        onSourcesAdded={handleSourcesDiscovered}
      />
    </div>
  );
}
