"use client";

import { HouseholdPresence } from "@/components/household";
import { TimeMark } from "@/components/marks";
import { NextCard } from "@/components/next-card";
import { PageIntro } from "@/components/page-intro";
import { PersonSwitch } from "@/components/person-switch";
import { SyncNote } from "@/components/sync-note";
import { TonightClose } from "@/components/tonight-close";
import { Button } from "@/components/ui/button";
import { greeting, nextHeading, periodLine, tonightHeading } from "@/lib/copy";
import { clockPeriod } from "@/lib/period";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function NowPage() {
  const { person, nextItem, screenWeight, state } = useStore();
  const helper = state.role === "helper";
  const period = clockPeriod();
  const quiet = screenWeight === "critical";
  const when = nextItem
    ? periodLine(period, screenWeight, person.talkStyle)
    : "";

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker={greeting(person, screenWeight)}
        title={
          nextItem
            ? nextHeading(screenWeight, person.talkStyle)
            : tonightHeading(person.talkStyle, period)
        }
        mark={<TimeMark period={period} />}
        quiet={quiet}
      >
        {when ? <p>{when}</p> : null}
        <SyncNote className="mt-1 text-sm" />
      </PageIntro>

      <div className="lg:hidden">
        <HouseholdPresence />
      </div>

      {helper ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Looking at</p>
          <PersonSwitch />
        </div>
      ) : null}

      {nextItem ? <NextCard item={nextItem} /> : <TonightClose />}

      {helper ? (
        <Button
          nativeButton={false}
          render={<Link href="/helper" />}
          variant="ghost"
          className="h-12 justify-start px-1 text-base underline-offset-4 hover:underline"
        >
          Add or change their steps
        </Button>
      ) : null}
    </div>
  );
}
