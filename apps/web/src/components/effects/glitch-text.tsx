interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GlitchText({ children, className = "" }: GlitchTextProps) {
  return (
    <span className={`animate-glitch inline-block ${className}`}>
      {children}
    </span>
  );
}
