"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PrototypeBadge } from "./prototype-badge";

const LINKS = [
  { href: "/submit", label: "Submit a gap" },
  { href: "/submissions", label: "Submissions" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function AppNav({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span>DS Gap Insights</span>
          <PrototypeBadge />
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">{rightSlot}</div>
      </div>
    </header>
  );
}
