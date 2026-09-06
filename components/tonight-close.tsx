"use client";

import { DoneMark, EmptyMark } from "@/components/marks";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import {
  tonightDoneLine,
  tonightMorningLine,
} from "@/lib/copy";
import { clockPeriod } from "@/lib/period";
import { tonightWaiting } from "@/lib/tonight";
import { useStore } from "@/lib/store";
import Link from "next/link";

export function TonightClose() {
  const { person, todayItems, isDone, isPostponed, screenWeight } = useStore();
  const period = clockPeriod();
  const done = todayItems.filter((item) => isDone(item.id));
  const postponed = todayItems.filter((item) => isPostponed(item.id) && !isDone(item.id));
  const remaining = todayItems.filter(
    (item) => !isDone(item.id) && !isPostponed(item.id),
  );
  const waiting = tonightWaiting({ postponed, remaining });
  const empty = todayItems.length === 0;
  const doneLine = tonightDoneLine(done, person, person.talkStyle);
  const morningLine = empty
    ? ""
    : tonightMorningLine(waiting, person.talkStyle);

  return (
    <WeightCard weight={screenWeight} period={period}>
      {empty ? (
        <EmptyMark className="mb-4 h-16 w-16" />
      ) : (
        <DoneMark className="mb-4 h-16 w-16 opacity-70" />
      )}
      <div className="space-y-3 text-xl leading-relaxed">
        {empty ? (
          <p>No personal steps for this person yet.</p>
        ) : (
          <>
            {doneLine ? <p>{doneLine}</p> : null}
            {morningLine ? (
              <p className="text-lg text-muted-foreground">{morningLine}</p>
            ) : null}
            {!doneLine && !morningLine ? <p>Today is done.</p> : null}
          </>
        )}
      </div>
      <Button
        nativeButton={false}
        render={<Link href="/today" />}
        variant="outline"
        className="mt-6 h-12 rounded-2xl px-5 text-base"
      >
        See today
      </Button>
    </WeightCard>
  );
}
