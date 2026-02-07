interface TopicSectionProps {
  topic: string;
  children: React.ReactNode;
}

export function TopicSection({ topic, children }: TopicSectionProps) {
  return (
    <section className="mb-8">
      <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-cyber-green mb-4 border-b border-cyber-overlay pb-2">
        {topic}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </section>
  );
}
