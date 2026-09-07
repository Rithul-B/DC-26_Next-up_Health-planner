"use client";

import { NavGlyph } from "@/components/marks";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Now", short: "Now", mark: "now" as const },
  { href: "/today", label: "Today", short: "Today", mark: "today" as const },
  { href: "/family", label: "Family", short: "Family", mark: "family" as const },
  { href: "/advice", label: "Advice", short: "Tips", mark: "advice" as const },
  { href: "/settings", label: "Easier", short: "Easy", mark: "easier" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { state } = useStore();
  const few = state.ease.fewWords;

  return (
    <nav
      aria-label="Main"
      className="bottom-nav fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-sm"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 px-1 py-2 lg:max-w-5xl">
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
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-xs font-semibold sm:text-sm",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                <NavGlyph name={link.mark} className="h-5 w-5" />
                {few ? link.short : link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
