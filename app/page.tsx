"use client";

import { HouseholdPresence } from "@/components/household";
import { DoneMark, EmptyMark, TimeMark } from "@/components/marks";
import { NextCard } from "@/components/next-card";
import { PageIntro } from "@/components/page-intro";
import { PersonSwitch } from "@/components/person-switch";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { caughtUp, greeting, nextHeading, periodLine } from "@/lib/copy";
import { clockPeriod } from "@/lib/period";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function NowPage() {
  const { person, nextItem, screenWeight, state, todayItems } = useStore();
  const helper = state.role === "helper";
  const period = clockPeriod();
  const quiet = screenWeight === "critical";
  const when = periodLine(period, screenWeight, person.talkStyle);

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker={greeting(person, screenWeight)}
        title={
          nextItem
            ? nextHeading(screenWeight, person.talkStyle)
            : caughtUp(person.talkStyle)
        }
        mark={<TimeMark period={period} />}
        quiet={quiet}
      >
        {when ? <p>{when}</p> : null}
        <p className="mt-1 text-sm">On this device.</p>
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

      {nextItem ? (
        <NextCard item={nextItem} />
      ) : (
        <WeightCard weight={screenWeight} period={period}>
          <EmptyMark className="mb-4 h-16 w-16" />
          <p className="text-xl leading-relaxed">
            {todayItems.length === 0
              ? "No personal steps for this person yet."
              : "Today is done."}
          </p>
          {todayItems.length > 0 ? (
            <DoneMark className="mt-3 h-12 w-12 opacity-70" />
          ) : null}
          <Button
            nativeButton={false}
            render={<Link href="/today" />}
            variant="outline"
            className="mt-6 h-12 rounded-2xl px-5 text-base"
          >
            See today
          </Button>
        </WeightCard>
      )}

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
