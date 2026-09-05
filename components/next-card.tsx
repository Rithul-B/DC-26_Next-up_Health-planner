"use client";

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
import { doneLine, timeLabels, whyLine } from "@/lib/copy";
import { useStore } from "@/lib/store";
import type { PersonalItem } from "@/lib/types";
import { useState } from "react";

export function NextCard({
  item,
  onDone,
}: {
  item: PersonalItem;
  onDone?: () => void;
}) {
  const { person, markDone, postpone, state } = useStore();
  const [justDone, setJustDone] = useState(false);
  const helper = state.role === "helper";

  function finish() {
    markDone(item.id);
    setJustDone(true);
    onDone?.();
  }

  if (justDone) {
    return (
      <section
        className="rounded-3xl border bg-card px-6 py-10 text-center shadow-sm"
        aria-live="polite"
      >
        <p className="text-2xl font-semibold">{doneLine(item.weight, person.talkStyle)}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border bg-card px-6 py-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {timeLabels[item.timeOfDay]}
        {item.place ? ` · ${item.place}` : ""}
      </p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {item.title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {whyLine(item, person.talkStyle)}
      </p>

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

        {item.weight === "critical" && helper ? (
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl text-base"
            onClick={() => postpone(item.id)}
          >
            Postpone for today
          </Button>
        ) : null}
      </div>
    </section>
  );
}
