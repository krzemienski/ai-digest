"use client";

import { useState } from "react";
import Link from "next/link";

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
  { href: "/podcasts", label: "Episodes" },
  { href: "#about", label: "About" },
  { href: "#subscribe", label: "Subscribe" },
] as const;

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-pub-bg border-b border-pub-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-wider">
            AI DIGEST
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-pub-text-secondary hover:text-pub-text transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/login"
              className="text-sm text-pub-blue hover:text-pub-blue-hover transition-colors ml-2 pl-4 border-l border-pub-border"
            >
              Login
            </Link>
          </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-pub-text-secondary hover:text-pub-text transition-colors"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-pub-border bg-pub-bg px-4 pb-4 pt-2">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-pub-text-secondary hover:text-pub-text transition-colors py-3 px-2 min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-pub-blue hover:text-pub-blue-hover py-3 px-2 min-h-[44px] flex items-center"
            >
              Login
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
