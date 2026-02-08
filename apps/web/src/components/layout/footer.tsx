import { Container } from "./container";

export function Footer() {
  return (
    <footer className="border-t border-surface-elevated py-8 mt-auto">
      <Container className="flex flex-col items-center gap-4 text-center">
        <p className="text-text-secondary text-sm">
          AI Digest — Curated AI News
        </p>
        <p className="text-text-secondary/50 text-xs">
          Powered by Claude + ElevenLabs
        </p>
      </Container>
    </footer>
  );
}
