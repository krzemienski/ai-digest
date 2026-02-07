"use client";

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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "admin-token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 bg-cyber-surface border-r border-cyber-overlay flex flex-col min-h-screen">
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
              className={`font-mono text-sm py-2 px-4 rounded transition-colors ${
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
          className="font-mono text-sm text-cyber-text-secondary hover:text-cyber-magenta transition-colors w-full text-left py-2 px-4"
          type="button"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
