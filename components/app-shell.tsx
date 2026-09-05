"use client";

import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, screenWeight, state } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("large-text", state.ease.largeText);
    root.classList.toggle("high-contrast", state.ease.highContrast);
    root.classList.toggle("reduce-motion", state.ease.reduceMotion);
    root.dataset.weight = screenWeight;
    root.classList.toggle("dark", screenWeight === "critical");
  }, [state.ease, screenWeight]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-lg text-muted-foreground">Opening Next Up…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col transition-colors duration-500",
        screenWeight === "critical" && "weight-critical",
        screenWeight === "important" && "weight-important",
        screenWeight === "everyday" && "weight-everyday",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <main
        id="main"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-28 pt-8 sm:px-6"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
