interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = "#3b82f6", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded ${className}`}
      style={{ color, borderColor: color, border: "1px solid" }}
    >
      {children}
    </span>
  );
}
