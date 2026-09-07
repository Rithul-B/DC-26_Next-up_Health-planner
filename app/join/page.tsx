"use client";

import { HouseMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { DEMO_JOIN_CODE } from "@/lib/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export default function JoinPage() {
  return (
    <Suspense
      fallback={<p className="text-lg text-muted-foreground">Opening join…</p>}
    >
      <JoinForm />
    </Suspense>
  );
}

function JoinForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { joinHousehold, claimInvite, state } = useStore();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [viewEveryone, setViewEveryone] = useState(true);
  const [mode, setMode] = useState<"join" | "claim">("join");
  const [houseName, setHouseName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next = (params.get("code") ?? "").toUpperCase();
    if (next) setCode(next);
  }, [params]);

  useEffect(() => {
    if (!code.trim()) {
      setHouseName(null);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`/api/join/preview?code=${encodeURIComponent(code)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setHouseName(data?.name ?? null);
        })
        .catch(() => null);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [code]);

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro kicker="Share link" title="Join this house" mark={<HouseMark />}>
        <p>
          {houseName
            ? `This code is for ${houseName}.`
            : "Use the code your family sent."}
        </p>
        {state.sync === "household" && state.household ? (
          <p className="mt-1 text-sm">
            You are in {state.household.name} now. Joining another house switches
            this device.
          </p>
        ) : null}
      </PageIntro>

      <WeightCard className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "join" ? "default" : "outline"}
            className="h-12 flex-1 rounded-2xl"
            onClick={() => setMode("join")}
          >
            House code
          </Button>
          <Button
            type="button"
            variant={mode === "claim" ? "default" : "outline"}
            className="h-12 flex-1 rounded-2xl"
            onClick={() => setMode("claim")}
          >
            Invite code
          </Button>
        </div>

        {mode === "join" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">House code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-14 text-lg tracking-wide"
                placeholder={DEMO_JOIN_CODE}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Sample house ({DEMO_JOIN_CODE}) needs only the code. A real house
              needs the email the head added, plus your password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-lg"
              />
            </div>
            <Button
              className="h-14 w-full rounded-2xl text-lg"
              disabled={busy || !code.trim()}
              onClick={async () => {
                setBusy(true);
                setError(null);
                const message = await joinHousehold({
                  code: code.trim(),
                  email: email.trim() || undefined,
                  password: password.trim() || undefined,
                });
                setBusy(false);
                if (message) {
                  setError(message);
                  return;
                }
                router.replace("/");
              }}
            >
              Join
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="claim-email">Email</Label>
              <Input
                id="claim-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite">Invite code</Label>
              <Input
                id="invite"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="h-14 text-lg tracking-wide"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New password</Label>
              <Input
                id="new-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-lg"
              />
            </div>
            <Button
              type="button"
              variant={viewEveryone ? "default" : "outline"}
              className="h-14 justify-start rounded-2xl"
              onClick={() => setViewEveryone(true)}
            >
              See everyone
            </Button>
            <Button
              type="button"
              variant={!viewEveryone ? "default" : "outline"}
              className="h-14 justify-start rounded-2xl"
              onClick={() => setViewEveryone(false)}
            >
              Only me
            </Button>
            <Button
              className="h-14 w-full rounded-2xl text-lg"
              disabled={busy || !email.trim() || !inviteCode.trim() || !password}
              onClick={async () => {
                setBusy(true);
                setError(null);
                const message = await claimInvite(
                  email.trim(),
                  inviteCode.trim(),
                  password,
                  viewEveryone,
                );
                setBusy(false);
                if (message) {
                  setError(message);
                  return;
                }
                router.replace("/");
              }}
            >
              Claim invite
            </Button>
          </>
        )}
        {error ? <p className="text-destructive">{error}</p> : null}
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          variant="ghost"
          className="h-11"
        >
          Back to Now
        </Button>
      </WeightCard>
    </div>
  );
}
