"use client";

import { DoneMark, TimeMark, WeightPip } from "@/components/marks";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WhisperEditor, WhisperLine } from "@/components/helper-whisper";
import { doneLine, timeLabels, whyLine } from "@/lib/copy";
import { dueLabel } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { PersonalItem } from "@/lib/types";
import { useState } from "react";

export function NextCard({
  item,
  onDone,
  onLater,
}: {
  item: PersonalItem;
  onDone?: () => void;
  onLater?: () => void;
}) {
  const { person, markDone, postpone, state } = useStore();
  const [justDone, setJustDone] = useState(false);
  const helper = state.role === "helper";
  const canLeaveForLater =
    item.weight === "everyday" || (item.weight === "critical" && helper);

  function finish() {
    markDone(item.id);
    setJustDone(true);
    onDone?.();
  }

  function later() {
    postpone(item.id);
    onLater?.();
  }

  if (justDone) {
    return (
      <WeightCard
        weight={item.weight}
        period={item.timeOfDay}
        className="px-6 py-10 text-center"
      >
        <DoneMark className="mx-auto mb-4 h-16 w-16" />
        <p className="text-2xl font-semibold" aria-live="polite">
          {doneLine(item.weight, person.talkStyle)}
        </p>
      </WeightCard>
    );
  }

  return (
    <WeightCard weight={item.weight} period={item.timeOfDay} className="px-6 py-8">
      <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        <TimeMark period={item.timeOfDay} className="h-8 w-8" />
        <span>
          {timeLabels[item.timeOfDay]}
          {item.place ? ` · ${item.place}` : ""}
        </span>
        <WeightPip weight={item.weight} className="ml-auto" />
      </div>
      <h2 className="page-title mt-4 text-[2rem] sm:text-[2.35rem]">
        {item.title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {whyLine(item, person.talkStyle)}
      </p>
      <WhisperLine item={item} className="mt-3 text-lg" />
      {item.due ? (
        <p className="mt-2 text-base font-medium">{dueLabel(item.due)}</p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        {item.weight === "critical" ? (
          <AlertDialog>
            <AlertDialogTrigger
              nativeButton={false}
              render={
                <Button className="h-16 w-full rounded-2xl text-xl font-semibold">
                  I did this
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark this as done?</AlertDialogTitle>
                <AlertDialogDescription>
                  This one matters. Only say yes if it is actually done.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Not yet</AlertDialogCancel>
                <AlertDialogAction onClick={finish}>Yes, it is done</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            className="h-16 w-full rounded-2xl text-xl font-semibold"
            onClick={finish}
          >
            I did this
          </Button>
        )}

        {canLeaveForLater ? (
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl text-base"
            onClick={later}
          >
            {item.weight === "critical"
              ? "Postpone for today"
              : "Later today"}
          </Button>
        ) : null}
        {helper ? <WhisperEditor item={item} /> : null}
      </div>
    </WeightCard>
  );
}
