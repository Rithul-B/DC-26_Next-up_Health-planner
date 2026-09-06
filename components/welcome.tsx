"use client";

import { HouseMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { talkStyleLabels } from "@/lib/copy";
import { useStore } from "@/lib/store";
import type { Role, TalkStyle } from "@/lib/types";
import { DEMO_JOIN_CODE } from "@/lib/types";
import { useState } from "react";

type Step = "pick" | "create" | "join";

export function WelcomeScreen() {
  const { createHousehold, joinHousehold, openDemo, stayLocal } = useStore();
  const [step, setStep] = useState<Step>("pick");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [householdName, setHouseholdName] = useState("");
  const [yourName, setYourName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("helper");
  const [talkStyle, setTalkStyle] = useState<TalkStyle>("plain");
  const [code, setCode] = useState("");

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await fn();
    setBusy(false);
    if (message) setError(message);
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro kicker="Next Up" title="Your household" mark={<HouseMark />}>
        <p>One next step. Your people. Shared Family Center.</p>
      </PageIntro>

      {step === "pick" ? (
        <div className="flex flex-col gap-3">
          <Button
            className="h-14 rounded-2xl text-lg font-semibold"
            onClick={() => setStep("create")}
          >
            Start a household
          </Button>
          <Button
            variant="outline"
            className="h-14 rounded-2xl text-lg"
            onClick={() => setStep("join")}
          >
            Join with a code
          </Button>
          <Button
            variant="outline"
            className="h-14 rounded-2xl text-lg"
            disabled={busy}
            onClick={() => void run(openDemo)}
          >
            Open the sample house
          </Button>
          <Button
            variant="ghost"
            className="h-12 text-base"
            onClick={stayLocal}
          >
            Stay on this device only
          </Button>
          <p className="text-sm text-muted-foreground">
            This device starts with just you. You, Dad, and Sam are the sample
            house (code {DEMO_JOIN_CODE}), not your household.
          </p>
        </div>
      ) : null}

      {step === "create" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Start a household</h2>
          <Field
            id="house"
            label="House name"
            value={householdName}
            onChange={setHouseholdName}
            placeholder="The Kims"
          />
          <Field
            id="you"
            label="Your first name"
            value={yourName}
            onChange={setYourName}
          />
          <Field
            id="pass"
            label="Optional password"
            value={password}
            onChange={setPassword}
            type="password"
          />
          <RolePick role={role} onPick={setRole} />
          <TalkPick value={talkStyle} onPick={setTalkStyle} />
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={busy || !householdName.trim() || !yourName.trim()}
            onClick={() =>
              void run(() =>
                createHousehold({
                  householdName: householdName.trim(),
                  yourName: yourName.trim(),
                  password: password.trim() || undefined,
                  role,
                  talkStyle,
                }),
              )
            }
          >
            Create house
          </Button>
          <Button variant="ghost" className="h-11" onClick={() => setStep("pick")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {step === "join" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Join a household</h2>
          <Field
            id="code"
            label="Join code"
            value={code}
            onChange={(v) => setCode(v.toUpperCase())}
            placeholder={DEMO_JOIN_CODE}
          />
          <Field
            id="join-name"
            label="Your first name"
            value={yourName}
            onChange={setYourName}
          />
          <Field
            id="join-pass"
            label="Password if they set one"
            value={password}
            onChange={setPassword}
            type="password"
          />
          <RolePick role={role} onPick={setRole} />
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={busy || !code.trim() || !yourName.trim()}
            onClick={() =>
              void run(() =>
                joinHousehold({
                  code: code.trim(),
                  name: yourName.trim(),
                  password: password.trim() || undefined,
                  role,
                  talkStyle,
                  addPerson: true,
                }),
              )
            }
          >
            Join
          </Button>
          <Button variant="ghost" className="h-11" onClick={() => setStep("pick")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {error ? <p className="text-base text-destructive">{error}</p> : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 text-base"
      />
    </div>
  );
}

function RolePick({ role, onPick }: { role: Role; onPick: (role: Role) => void }) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="How you use this">
      <Button
        type="button"
        variant={role === "person" ? "default" : "outline"}
        className="h-12 justify-start rounded-2xl"
        onClick={() => onPick("person")}
      >
        For me
      </Button>
      <Button
        type="button"
        variant={role === "helper" ? "default" : "outline"}
        className="h-12 justify-start rounded-2xl"
        onClick={() => onPick("helper")}
      >
        I’m helping
      </Button>
    </div>
  );
}

function TalkPick({
  value,
  onPick,
}: {
  value: TalkStyle;
  onPick: (style: TalkStyle) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {(["plain", "few-words", "encouraging"] as const).map((style) => (
        <Button
          key={style}
          type="button"
          variant={value === style ? "default" : "outline"}
          className="h-12 justify-start rounded-2xl"
          onClick={() => onPick(style)}
        >
          {talkStyleLabels[style]}
        </Button>
      ))}
    </div>
  );
}
