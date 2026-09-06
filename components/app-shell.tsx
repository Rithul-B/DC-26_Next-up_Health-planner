"use client";

import { Atmosphere } from "@/components/atmosphere";
import { BottomNav } from "@/components/bottom-nav";
import { DueBanner } from "@/components/due-banner";
import { HouseholdPresence } from "@/components/household";
import { WelcomeScreen } from "@/components/welcome";
import { clockPeriod } from "@/lib/period";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, screenWeight, state, phase } = useStore();
  const period = clockPeriod();
  const pathname = usePathname();
  const onJoin = pathname.startsWith("/join");
  const showWelcome = ready && phase === "welcome" && !onJoin;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("large-text", state.ease.largeText);
    root.classList.toggle("high-contrast", state.ease.highContrast);
    root.classList.toggle("reduce-motion", state.ease.reduceMotion);
    root.dataset.weight = screenWeight;
    root.dataset.period = period;
    root.classList.toggle("dark", screenWeight === "critical");
  }, [state.ease, screenWeight, period]);

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
        "app-frame flex min-h-dvh flex-col transition-colors duration-500",
        screenWeight === "critical" && "weight-critical",
        screenWeight === "important" && "weight-important",
        screenWeight === "everyday" && "weight-everyday",
      )}
    >
      <Atmosphere weight={screenWeight} period={period} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="desktop-shell flex flex-1 flex-col lg:pt-10">
        {!showWelcome && !onJoin ? (
          <div className="desktop-rail">
            <HouseholdPresence layout="stack" />
          </div>
        ) : null}
        <main
          id="main"
          className="desktop-main mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-28 pt-8 sm:px-6 lg:max-w-none lg:px-0 lg:pt-0"
        >
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <>
              {!onJoin ? <DueBanner /> : null}
              {children}
            </>
          )}
        </main>
      </div>
      {!showWelcome && !onJoin ? <BottomNav /> : null}
    </div>
  );
}
