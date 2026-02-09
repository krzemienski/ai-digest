interface WaveformVisualProps {
  className?: string;
}

export function WaveformVisual({ className = "" }: WaveformVisualProps) {
  // Generate ~40 bars with varying heights using Math.sin pattern
  const bars = Array.from({ length: 40 }, (_, i) => {
    const height = 8 + Math.abs(Math.sin(i * 0.5)) * 40;
    const isRed = i % 2 === 0;
    return { height, isRed };
  });

  return (
    <div className={`flex items-end justify-center gap-[3px] h-16 ${className}`}>
      {bars.map((bar, idx) => (
        <div
          key={idx}
          className={`w-[2px] rounded-full origin-bottom animate-pulse ${
            bar.isRed ? "bg-pub-red/30" : "bg-pub-blue/30"
          }`}
          style={{
            height: `${bar.height}px`,
            animationDuration: "1.5s",
            animationDelay: `${idx * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
