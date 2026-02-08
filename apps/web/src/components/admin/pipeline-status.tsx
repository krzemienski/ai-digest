interface PipelineStatusProps {
  readonly status: "idle" | "running" | "completed" | "failed" | null;
}

const STATUS_STYLES: Record<string, string> = {
  idle: "bg-surface-elevated text-text-secondary",
  running: "bg-accent/20 text-accent animate-pulse",
  completed: "bg-success/20 text-success",
  failed: "bg-destructive/20 text-destructive",
};

function getStatusLabel(status: PipelineStatusProps["status"]): string {
  if (status === null) return "No runs";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusStyle(status: PipelineStatusProps["status"]): string {
  if (status === null) return STATUS_STYLES["idle"] as string;
  return STATUS_STYLES[status] ?? (STATUS_STYLES["idle"] as string);
}

export function PipelineStatus({ status }: PipelineStatusProps) {
  return (
    <span
      className={`text-sm px-3 py-1 rounded-full inline-block ${getStatusStyle(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
