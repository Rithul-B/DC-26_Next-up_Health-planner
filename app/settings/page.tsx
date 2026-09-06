"use client";

import { EaseMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { PersonSwitch } from "@/components/person-switch";
import { ShareHouse } from "@/components/share-house";
import { WeightCard } from "@/components/weight-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { requestReminderPermission } from "@/lib/notify";
import { STORE_KEY } from "@/lib/seed";
import { LOCAL_ONLY_KEY, useStore } from "@/lib/store";
import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
  const { state, setEase, setRole, leaveHousehold } = useStore();
  const [permNote, setPermNote] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker={state.sync === "household" ? "This house" : "This device"}
        title="Easier"
        mark={<EaseMark />}
      >
        <p>Make the app quieter or bigger. Reminders stay on this device.</p>
      </PageIntro>

      {state.sync === "household" ? <ShareHouse /> : (
        <WeightCard>
          <h2 className="text-xl font-semibold">On this device only</h2>
          <p className="mt-2 text-muted-foreground">
            This browser is not signed into a shared house. Start or join one
            to sync phones.
          </p>
          <Button
            variant="outline"
            className="mt-4 h-12 rounded-2xl text-base"
            onClick={() => {
              localStorage.removeItem(LOCAL_ONLY_KEY);
              window.location.href = "/";
            }}
          >
            Start or join a house
          </Button>
        </WeightCard>
      )}

      <WeightCard className="space-y-5">
        <h2 className="text-xl font-semibold">Who is using this</h2>
        <div className="flex flex-col gap-2" role="group" aria-label="Role">
          <Button
            type="button"
            variant={state.role === "person" ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => setRole("person")}
          >
            For me
          </Button>
          <Button
            type="button"
            variant={state.role === "helper" ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => setRole("helper")}
          >
            I’m helping
          </Button>
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
            <Button
              nativeButton={false}
              render={<Link href="/people" />}
              variant="ghost"
              className="h-12 rounded-2xl text-base"
            >
              Add people
            </Button>
          </div>
        ) : null}
      </WeightCard>

      <WeightCard className="space-y-5" weight="important">
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
        <ToggleRow
          id="remind"
          label="Remind me on this device"
          checked={state.ease.reminders}
          onChange={async (on) => {
            if (on) {
              const ok = await requestReminderPermission();
              setEase({ reminders: ok });
              setPermNote(
                ok
                  ? "This browser will ping when something is due."
                  : "This browser blocked notifications. Due banners still show.",
              );
              return;
            }
            setEase({ reminders: false });
            setPermNote(null);
          }}
        />
        {permNote ? (
          <p className="text-sm text-muted-foreground">{permNote}</p>
        ) : null}
      </WeightCard>

      <WeightCard weight="important">
        <h2 className="text-xl font-semibold">This is a planner</h2>
        <p className="mt-2 text-muted-foreground">
          Next Up is not medical advice and not a medical device. It is not
          HIPAA-covered. Not for emergencies. A shared house syncs the board.
          Ease settings stay on this device.
        </p>
        {state.sync === "household" ? (
          <Button
            variant="ghost"
            className="mt-3 h-11 px-0 text-base"
            onClick={() => void leaveHousehold()}
          >
            Leave this house
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="mt-3 h-11 px-0 text-base"
            onClick={() => {
              localStorage.removeItem(STORE_KEY);
              window.location.href = "/";
            }}
          >
            Reset local demo data
          </Button>
        )}
      </WeightCard>
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
