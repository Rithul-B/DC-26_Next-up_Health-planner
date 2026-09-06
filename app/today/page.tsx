"use client";

import { HouseholdPresence } from "@/components/household";
import { EmptyMark, TimeMark, WeightPip } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { PersonSwitch } from "@/components/person-switch";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { WhisperLine } from "@/components/helper-whisper";
import { timeLabels, weightLabels } from "@/lib/copy";
import { clockPeriod } from "@/lib/period";
import { useStore } from "@/lib/store";
import { TIME_ORDER } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function TodayPage() {
  const {
    person,
    todayItems,
    isDone,
    isPostponed,
    undoDone,
    unpostpone,
    state,
    checkIn,
    screenWeight,
  } = useStore();
  const helper = state.role === "helper";
  const period = clockPeriod();

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker="Personal list"
        title="Today"
        mark={<TimeMark period={period} />}
        quiet={screenWeight === "critical"}
      >
        <p>
          {person.name}’s personal steps. Shared checkups live in Family.
        </p>
      </PageIntro>

      <div className="lg:hidden">
        <HouseholdPresence />
      </div>

      {helper ? <PersonSwitch /> : null}

      {todayItems.length === 0 ? (
        <WeightCard weight={screenWeight} period={period}>
          <EmptyMark className="mb-3 h-14 w-14" />
          <p className="text-lg">
            Nothing on this list yet.
            {helper ? " Add a step from Helper." : ""}
          </p>
        </WeightCard>
      ) : (
        <div className="space-y-7">
          {TIME_ORDER.map((tod) => {
            const rows = todayItems.filter((item) => item.timeOfDay === tod);
            if (rows.length === 0) return null;
            return (
              <section key={tod} className="space-y-3">
                <h2 className="section-label">
                  <TimeMark period={tod} />
                  {timeLabels[tod]}
                </h2>
                <ul className="space-y-3">
                  {rows.map((item) => {
                    const done = isDone(item.id);
                    const later = isPostponed(item.id);
                    return (
                      <li key={item.id}>
                        <WeightCard
                          as="div"
                          weight={item.weight}
                          period={item.timeOfDay}
                          className="p-0"
                        >
                          <Link
                            href={`/item/${item.id}`}
                            className={cn(
                              "block px-5 py-5 focus-visible:ring-3 focus-visible:ring-ring/50",
                              done && "opacity-60",
                            )}
                          >
                            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <WeightPip weight={item.weight} />
                              {weightLabels[item.weight]}
                              {later ? " · Later today" : ""}
                              {done ? " · Done" : ""}
                            </p>
                            <p className="mt-1 text-xl font-semibold">{item.title}</p>
                            <WhisperLine item={item} className="mt-1" />
                          </Link>
                        </WeightCard>
                        {done ? (
                          <Button
                            variant="ghost"
                            className="mt-1 h-11 px-2 text-base"
                            onClick={() => undoDone(item.id)}
                          >
                            Undo
                          </Button>
                        ) : null}
                        {later && !done ? (
                          <Button
                            variant="ghost"
                            className="mt-1 h-11 px-2 text-base"
                            onClick={() => unpostpone(item.id)}
                          >
                            Bring back
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <WeightCard weight={screenWeight} period={period}>
        <p className="text-sm font-medium text-muted-foreground">Check-in</p>
        <p className="mt-1 text-xl font-semibold">
          {checkIn
            ? checkIn === "good"
              ? "Today feels good."
              : checkIn === "ok"
                ? "Today feels okay."
                : "Today feels hard."
            : "Not filled in yet."}
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/check-in" />}
          variant="outline"
          className="mt-4 h-12 rounded-2xl px-5 text-base"
        >
          {checkIn ? "Change check-in" : "Do check-in"}
        </Button>
      </WeightCard>
    </div>
  );
}
