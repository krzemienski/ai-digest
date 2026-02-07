import Link from "next/link";
import { Container } from "./container";

export function Header() {
  return (
    <header className="border-b border-cyber-overlay bg-cyber-bg/80 backdrop-blur-sm sticky top-0 z-40">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-mono text-xl font-bold text-cyber-cyan tracking-wider hover:shadow-neon-cyan transition-shadow">
          AI DIGEST
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/digests" className="text-sm text-cyber-text-secondary hover:text-cyber-cyan transition-colors font-mono">
            Digests
          </Link>
          <Link href="/podcasts" className="text-sm text-cyber-text-secondary hover:text-cyber-cyan transition-colors font-mono">
            Podcasts
          </Link>
          <Link href="/search" className="text-sm text-cyber-text-secondary hover:text-cyber-cyan transition-colors font-mono">
            Search
          </Link>
          <Link href="/archive" className="text-sm text-cyber-text-secondary hover:text-cyber-cyan transition-colors font-mono">
            Archive
          </Link>
        </nav>
      </Container>
    </header>
  );
}
