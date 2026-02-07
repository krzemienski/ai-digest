import { Container } from "./container";

export function Footer() {
  return (
    <footer className="border-t border-cyber-overlay py-8 mt-auto">
      <Container className="flex flex-col items-center gap-4 text-center">
        <p className="text-cyber-text-secondary text-sm font-mono">
          AI Digest — Curated AI News
        </p>
        <p className="text-cyber-text-secondary/50 text-xs">
          Powered by Claude + ElevenLabs
        </p>
      </Container>
    </footer>
  );
}
