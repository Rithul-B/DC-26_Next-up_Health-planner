"use client";

import { HouseMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
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
  const { joinHousehold, state } = useStore();
  const [code, setCode] = useState(
    (params.get("code") ?? "").toUpperCase(),
  );
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("person");
  const [houseName, setHouseName] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
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
          if (!data?.name) {
            setHouseName(null);
            setNeedsPassword(false);
            return;
          }
          setHouseName(data.name);
          setNeedsPassword(Boolean(data.hasPassword));
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
        <div className="space-y-2">
          <Label htmlFor="code">Join code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="h-12 text-base tracking-wide"
            placeholder={DEMO_JOIN_CODE}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Your first name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        {needsPassword ? (
          <div className="space-y-2">
            <Label htmlFor="password">House password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={role === "person" ? "default" : "outline"}
            className="h-12 justify-start rounded-2xl"
            onClick={() => setRole("person")}
          >
            For me
          </Button>
          <Button
            type="button"
            variant={role === "helper" ? "default" : "outline"}
            className="h-12 justify-start rounded-2xl"
            onClick={() => setRole("helper")}
          >
            I’m helping
          </Button>
        </div>
        <Button
          className="h-14 w-full rounded-2xl text-lg"
          disabled={busy || !code.trim() || !name.trim()}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const message = await joinHousehold({
              code: code.trim(),
              name: name.trim(),
              password: password.trim() || undefined,
              role,
              addPerson: true,
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
