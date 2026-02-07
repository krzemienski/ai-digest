"use client";
import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Dialog({ open, onClose, children, title }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-cyber-surface border border-cyber-overlay rounded-lg p-6 backdrop:bg-black/70 text-cyber-text max-w-lg w-full"
    >
      {title && (
        <h2 className="font-mono text-lg text-cyber-cyan mb-4">{title}</h2>
      )}
      {children}
    </dialog>
  );
}
