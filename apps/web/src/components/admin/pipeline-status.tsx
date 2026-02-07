interface PipelineStatusProps {
  readonly status: "idle" | "running" | "completed" | "failed" | null;
}

const STATUS_STYLES: Record<string, string> = {
  idle: "bg-cyber-overlay text-cyber-text-secondary",
  running: "bg-cyber-cyan/20 text-cyber-cyan animate-pulse",
  completed: "bg-cyber-green/20 text-cyber-green",
  failed: "bg-cyber-magenta/20 text-cyber-magenta",
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
      className={`font-mono text-sm px-3 py-1 rounded-full inline-block ${getStatusStyle(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
