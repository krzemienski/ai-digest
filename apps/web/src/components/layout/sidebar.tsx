"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/config", label: "Config" },
  { href: "/admin/podcast", label: "Podcast" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/subscribers", label: "Subscribers" },
] as const;

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function SidebarNav({ onNavigate }: { readonly onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "admin-token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  return (
    <>
      <div className="py-4 px-4">
        <h2 className="font-mono text-lg text-cyber-cyan">Admin</h2>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`font-mono text-sm py-2 px-4 rounded transition-colors min-h-[44px] flex items-center ${
                isActive
                  ? "text-cyber-cyan bg-cyber-overlay/50"
                  : "text-cyber-text-secondary hover:text-cyber-cyan"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cyber-overlay">
        <button
          onClick={handleLogout}
          className="font-mono text-sm text-cyber-text-secondary hover:text-cyber-magenta transition-colors w-full text-left py-2 px-4 min-h-[44px]"
          type="button"
        >
          Logout
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden sticky top-0 z-30 bg-cyber-surface border-b border-cyber-overlay px-4 py-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] text-cyber-text-secondary hover:text-cyber-cyan transition-colors"
          aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
        >
          <MenuIcon />
        </button>
        <span className="font-mono text-sm text-cyber-cyan">Admin Menu</span>
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside className="relative z-50 w-64 bg-cyber-surface border-r border-cyber-overlay flex flex-col max-h-screen overflow-y-auto">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-cyber-surface border-r border-cyber-overlay flex-col min-h-screen shrink-0">
        <SidebarNav />
      </aside>
    </>
  );
}
