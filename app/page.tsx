"use client";

import { NextCard } from "@/components/next-card";
import { PersonSwitch } from "@/components/person-switch";
import { Button } from "@/components/ui/button";
import { caughtUp, greeting, nextHeading } from "@/lib/copy";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function NowPage() {
  const { person, nextItem, screenWeight, state, todayItems } = useStore();
  const helper = state.role === "helper";

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-3">
        <p className="text-lg text-muted-foreground">
          {greeting(person, screenWeight)}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {nextItem
            ? nextHeading(screenWeight, person.talkStyle)
            : caughtUp(person.talkStyle)}
        </h1>
        <p className="text-sm text-muted-foreground">On this device.</p>
      </header>

      {helper ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Looking at</p>
          <PersonSwitch />
        </div>
      ) : null}

      {nextItem ? (
        <NextCard item={nextItem} />
      ) : (
        <section className="rounded-3xl border bg-card px-6 py-10">
          <p className="text-xl leading-relaxed">
            {todayItems.length === 0
              ? "No personal steps for this person yet."
              : "Today is done."}
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/today" />}
            variant="outline"
            className="mt-6 h-12 rounded-2xl px-5 text-base"
          >
            See today
          </Button>
        </section>
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
