"use client";

import { PersonSwitch } from "@/components/person-switch";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { STORE_KEY } from "@/lib/seed";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function SettingsPage() {
  const { state, setEase, setRole } = useStore();

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Easier</h1>
        <p className="text-lg text-muted-foreground">
          These stay on this device. Make the app quieter or bigger.
        </p>
      </header>

      <section className="space-y-5 rounded-3xl border bg-card px-5 py-6">
        <h2 className="text-xl font-semibold">Who is using this</h2>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="helper" className="text-base leading-snug">
            I’m helping someone
          </Label>
          <Switch
            id="helper"
            checked={state.role === "helper"}
            onCheckedChange={(on) => setRole(on ? "helper" : "person")}
          />
        </div>
        {state.role === "helper" ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Looking at</p>
            <PersonSwitch />
            <Button
              nativeButton={false}
              render={<Link href="/helper" />}
              variant="outline"
              className="h-12 rounded-2xl text-base"
            >
              Open helper tools
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-5 rounded-3xl border bg-card px-5 py-6">
        <h2 className="text-xl font-semibold">Make it easier</h2>
        <ToggleRow
          id="large"
          label="Larger text"
          checked={state.ease.largeText}
          onChange={(on) => setEase({ largeText: on })}
        />
        <ToggleRow
          id="contrast"
          label="Higher contrast"
          checked={state.ease.highContrast}
          onChange={(on) => setEase({ highContrast: on })}
        />
        <ToggleRow
          id="motion"
          label="Reduce motion"
          checked={state.ease.reduceMotion}
          onChange={(on) => setEase({ reduceMotion: on })}
        />
      </section>

      <section className="rounded-3xl border bg-card px-5 py-6">
        <h2 className="text-xl font-semibold">This is a demo</h2>
        <p className="mt-2 text-muted-foreground">
          Next Up does not replace a clinician. Data stays in this browser. Not
          for emergencies.
        </p>
        <Button
          variant="ghost"
          className="mt-3 h-11 px-0 text-base"
          onClick={() => {
            localStorage.removeItem(STORE_KEY);
            window.location.href = "/";
          }}
        >
          Reset demo data
        </Button>
      </section>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
