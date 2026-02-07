interface ScoreIndicatorProps {
  score: number;
  className?: string;
}

export function ScoreIndicator({ score, className = "" }: ScoreIndicatorProps) {
  const percent = Math.round(score * 100);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 w-16 bg-cyber-overlay rounded-full overflow-hidden">
        <div
          className="h-full bg-cyber-cyan rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-cyber-text-secondary font-mono">{percent}%</span>
    </div>
  );
}
