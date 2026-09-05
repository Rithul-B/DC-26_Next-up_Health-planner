"use client";

import { NavGlyph } from "@/components/marks";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Now", mark: "now" as const },
  { href: "/today", label: "Today", mark: "today" as const },
  { href: "/family", label: "Family", mark: "family" as const },
  { href: "/settings", label: "Easier", mark: "easier" as const },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="bottom-nav fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-sm"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4 px-2 py-2 lg:max-w-5xl">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-sm font-semibold sm:text-base",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                <NavGlyph name={link.mark} className="h-5 w-5" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
