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
  const [copied, setCopied] = useState<string | null>(null);
  if (state.sync !== "household" || !state.household) return null;
  if (state.ease.hideExtra) return null;

  const url = shareUrl(state.household.joinCode);
  const pending = state.invites.filter((row) => !row.claimed && row.inviteCode);

  return (
    <WeightCard className={compact ? "space-y-2" : "space-y-3"}>
      <h2 className="text-xl font-semibold">Share this house</h2>
      <p className="text-muted-foreground">
        House code is extra. Each person still needs their own email. The same
        email cannot sit in two houses.
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
            setCopied("link");
            window.setTimeout(() => setCopied(null), 2000);
          } catch {
            setCopied(null);
          }
        }}
      >
        {copied === "link" ? "Copied" : "Copy share link"}
      </Button>

      {state.isHead ? (
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-semibold">People and invites</h3>
          {state.mailSent ? (
            <p className="text-sm text-muted-foreground">
              Invite email was sent when the server has mail set up.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Mail is not set up on this server. Share the invite code yourself.
              We will not pretend a message was sent.
            </p>
          )}
          <ul className="space-y-3">
            {state.invites.map((row) => (
              <li key={row.id} className="rounded-2xl border px-4 py-3">
                <p className="font-semibold">
                  {row.name}
                  {row.isHead ? " · head" : ""}
                </p>
                <p className="text-sm text-muted-foreground">{row.email || "No email"}</p>
                {row.claimed ? (
                  <p className="text-sm">Signed in with their password.</p>
                ) : row.inviteCode ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <p className="text-lg font-semibold tracking-wide">
                      {row.inviteCode}
                    </p>
                    <Button
                      variant="outline"
                      className="h-11 rounded-2xl"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(row.inviteCode ?? "");
                          setCopied(row.id);
                          window.setTimeout(() => setCopied(null), 2000);
                        } catch {
                          setCopied(null);
                        }
                      }}
                    >
                      {copied === row.id ? "Copied" : "Copy invite code"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm">Waiting to sign in.</p>
                )}
              </li>
            ))}
          </ul>
          {pending.length === 0 && state.invites.length > 0 ? (
            <p className="text-sm text-muted-foreground">Everyone has claimed.</p>
          ) : null}
        </div>
      ) : null}
    </WeightCard>
  );
}
