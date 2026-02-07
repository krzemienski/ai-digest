"use client";

import { useState, useCallback } from "react";
import { SourceTable } from "@/components/admin/source-table";
import { SourceForm } from "@/components/admin/source-form";
import { Button } from "@/components/ui/button";

interface SourceData {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly config: Record<string, unknown>;
  readonly enabled: boolean;
}

export default function AdminSourcesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-2xl text-cyber-cyan">Sources</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Source
        </Button>
      </div>

      <SourceTable key={refreshKey} onEdit={handleEdit} />

      {showForm && (
        <SourceForm
          source={editingSource}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
