"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface AuthUser {
  email: string;
  role: string;
}

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setUser({ email: data.data.email, role: data.data.role });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-surface-elevated bg-bg/80 backdrop-blur-sm sticky top-0 z-40">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold text-accent tracking-wider hover:transition-shadow">
          AI DIGEST
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-4 ml-2 pl-4 border-l border-surface-elevated">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  Admin
                </Link>
              )}
              <span className="text-xs text-text-secondary truncate max-w-[140px]">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-text-secondary hover:text-accent transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm text-accent hover:underline ml-2 pl-4 border-l border-surface-elevated"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-text-secondary hover:text-accent transition-colors"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </Container>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-surface-elevated bg-bg/95 backdrop-blur-sm px-4 pb-4 pt-2">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-text-secondary hover:text-accent transition-colors py-3 px-2 min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-text-secondary hover:text-accent transition-colors py-3 px-2 min-h-[44px] flex items-center"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="text-sm text-text-secondary hover:text-accent transition-colors py-3 px-2 min-h-[44px] flex items-center text-left"
                >
                  Logout ({user.email})
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-accent py-3 px-2 min-h-[44px] flex items-center"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
