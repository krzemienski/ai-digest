import Link from "next/link";

const footerLinks = [
  { href: "#", label: "RSS" },
  { href: "https://x.com", label: "X" },
  { href: "https://github.com", label: "GitHub" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-pub-border bg-pub-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-sm font-bold tracking-wider text-pub-text-secondary">
          AI DIGEST
        </div>

        <div className="flex gap-6 mt-4">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pub-text-muted hover:text-pub-text-secondary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="text-xs text-pub-text-muted mt-8">
          © 2026 AI Digest. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
