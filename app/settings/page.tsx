"use client";

import { EaseMark } from "@/components/marks";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { PageIntro } from "@/components/page-intro";
import { PersonSwitch } from "@/components/person-switch";
import { ShareHouse } from "@/components/share-house";
import { WeightCard } from "@/components/weight-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { enableDeviceNotifications } from "@/lib/notify";
import { looksLikeSamplePeople } from "@/lib/demo-family";
import { STORE_KEY } from "@/lib/seed";
import { LOCAL_ONLY_KEY, useStore } from "@/lib/store";
import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
  const { state, setEase, setRole, setViewEveryone, leaveHousehold, signOut } =
    useStore();
  const [permNote, setPermNote] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker={state.sync === "household" ? "This house" : "This device"}
        title={state.ease.fewWords ? "Easy" : "Easier"}
        mark={<EaseMark />}
      >
        <p>
          {state.ease.fewWords
            ? "Bigger type. Fewer words. Quieter screen."
            : "Make the app quieter or bigger. Reminders stay honest about what a phone can do."}
        </p>
      </PageIntro>

      {state.sync === "household" ? <ShareHouse /> : (
        <WeightCard>
          <h2 className="text-xl font-semibold">On this device only</h2>
          <p className="mt-2 text-muted-foreground">
            {looksLikeSamplePeople(state.people)
              ? "This browser is using the You / Dad / Sam sample. Those names are examples, not your household. Sign up or log in to use your own names and sync phones."
              : "This browser is not signed into a shared house. Sign up or log in to sync phones."}
          </p>
          <Button
            variant="outline"
            className="mt-4 h-12 rounded-2xl text-base"
            onClick={() => {
              localStorage.removeItem(LOCAL_ONLY_KEY);
              window.location.href = "/";
            }}
          >
            Log in or sign up
          </Button>
        </WeightCard>
      )}

      {state.sync === "household" && !state.isHead ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">What you see</h2>
          <p className="text-muted-foreground">
            You can see the whole house, or only your own list. We remember this
            on this account.
          </p>
          <Button
            type="button"
            variant={state.viewEveryone ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => void setViewEveryone(true)}
          >
            See everyone
          </Button>
          <Button
            type="button"
            variant={!state.viewEveryone ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => void setViewEveryone(false)}
          >
            Only me
          </Button>
        </WeightCard>
      ) : null}

      <WeightCard className="space-y-5">
        <h2 className="text-xl font-semibold">Who is using this</h2>
        <div className="flex flex-col gap-2" role="group" aria-label="Role">
          <Button
            type="button"
            variant={state.role === "person" ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => setRole("person")}
          >
            This is for me
          </Button>
          <Button
            type="button"
            variant={state.role === "helper" ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => setRole("helper")}
          >
            I’m a helper
          </Button>
        </div>
        {state.role === "helper" && (state.isHead || state.viewEveryone) ? (
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
              People
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
          id="xlarge"
          label="Even larger type"
          checked={state.ease.extraLargeText}
          onChange={(on) => setEase({ extraLargeText: on, largeText: on || state.ease.largeText })}
        />
        <ToggleRow
          id="few"
          label="Fewer words"
          checked={state.ease.fewWords}
          onChange={(on) => setEase({ fewWords: on })}
        />
        <ToggleRow
          id="hide"
          label="Hide extra panels"
          checked={state.ease.hideExtra}
          onChange={(on) => setEase({ hideExtra: on })}
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
              const note = await enableDeviceNotifications();
              setEase({ reminders: !note.includes("blocked") });
              setPermNote(note);
              return;
            }
            setEase({ reminders: false });
            setPermNote(null);
          }}
        />
        {permNote ? (
          <p className="text-sm text-muted-foreground">{permNote}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            In-app banners always work while you are here. Locked-screen push
            can work with Web Push if you allow it. A phone that is fully off or
            has no network cannot notify you.
          </p>
        )}
      </WeightCard>

      <WeightCard weight="important">
        <h2 className="text-xl font-semibold">This is a planner</h2>
        <div className="mt-2">
          <MedicalDisclaimer />
        </div>
        <p className="mt-2 text-muted-foreground">
          We do not claim HIPAA. Ease settings stay on this device. There is no
          paid subscription.
        </p>
        {state.sync === "household" ? (
          <div className="mt-3 flex flex-col items-start gap-1">
            <Button
              variant="ghost"
              className="h-11 px-0 text-base"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-0 text-base"
              onClick={() => void leaveHousehold()}
            >
              Leave this house
            </Button>
            <p className="text-sm text-muted-foreground">
              Leave frees your email so you can join a different house. Sign out
              keeps you in this house.
            </p>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="mt-3 h-11 px-0 text-base"
            onClick={() => {
              localStorage.removeItem(STORE_KEY);
              window.location.href = "/";
            }}
          >
            Reset this device
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
