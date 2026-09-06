"use client";

import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useState } from "react";

export function shareUrl(joinCode: string): string {
  if (typeof window === "undefined") return `/join?code=${joinCode}`;
  return `${window.location.origin}/join?code=${joinCode}`;
}

export function ShareHouse({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  const [copied, setCopied] = useState(false);
  if (state.sync !== "household" || !state.household) return null;

  const url = shareUrl(state.household.joinCode);

  return (
    <WeightCard className={compact ? "space-y-2" : "space-y-3"}>
      <h2 className="text-xl font-semibold">Share this house</h2>
      <p className="text-muted-foreground">
        Family uses this link or code. Helper or person — same Family Center.
      </p>
      <p className="text-2xl font-semibold tracking-wide">
        {state.household.joinCode}
      </p>
      <p className="break-all text-sm text-muted-foreground">{url}</p>
      <Button
        variant="outline"
        className="h-12 rounded-2xl text-base"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy share link"}
      </Button>
    </WeightCard>
  );
}
