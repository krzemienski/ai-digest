"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "./container";

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const navLinks = [
  { href: "/digests", label: "Digests" },
  { href: "/podcasts", label: "Podcasts" },
  { href: "/search", label: "Search" },
  { href: "/archive", label: "Archive" },
] as const;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-cyber-overlay bg-cyber-bg/80 backdrop-blur-sm sticky top-0 z-40">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-mono text-xl font-bold text-cyber-cyan tracking-wider hover:shadow-neon-cyan transition-shadow">
          AI DIGEST
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-cyber-text-secondary hover:text-cyber-cyan transition-colors font-mono"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-cyber-text-secondary hover:text-cyber-cyan transition-colors"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </Container>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-cyber-overlay bg-cyber-bg/95 backdrop-blur-sm px-4 pb-4 pt-2">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-cyber-text-secondary hover:text-cyber-cyan transition-colors font-mono py-3 px-2 min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
