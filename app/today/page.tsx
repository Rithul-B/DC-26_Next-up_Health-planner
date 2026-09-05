"use client";

import { PersonSwitch } from "@/components/person-switch";
import { Button } from "@/components/ui/button";
import { timeLabels, weightLabels } from "@/lib/copy";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function TodayPage() {
  const { person, todayItems, isDone, isPostponed, undoDone, state, checkIn } =
    useStore();
  const helper = state.role === "helper";

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Today</h1>
        <p className="text-lg text-muted-foreground">
          {person.name}’s personal steps. Shared checkups live in Family.
        </p>
      </header>

      {helper ? <PersonSwitch /> : null}

      {todayItems.length === 0 ? (
        <p className="rounded-3xl border bg-card px-6 py-8 text-lg">
          Nothing on this list yet.
          {helper ? " Add a step from Helper." : ""}
        </p>
      ) : (
        <ul className="space-y-3">
          {todayItems.map((item) => {
            const done = isDone(item.id);
            const later = isPostponed(item.id);
            return (
              <li key={item.id}>
                <Link
                  href={`/item/${item.id}`}
                  className={cn(
                    "block rounded-3xl border bg-card px-5 py-5 focus-visible:ring-3 focus-visible:ring-ring/50",
                    done && "opacity-60",
                  )}
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    {timeLabels[item.timeOfDay]} · {weightLabels[item.weight]}
                    {later ? " · Later today" : ""}
                    {done ? " · Done" : ""}
                  </p>
                  <p className="mt-1 text-xl font-semibold">{item.title}</p>
                </Link>
                {done ? (
                  <Button
                    variant="ghost"
                    className="mt-1 h-11 px-2 text-base"
                    onClick={() => undoDone(item.id)}
                  >
                    Undo
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <section className="rounded-3xl border bg-card px-5 py-5">
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
          render={<Link href="/check-in" />}
          variant="outline"
          className="mt-4 h-12 rounded-2xl px-5 text-base"
        >
          {checkIn ? "Change check-in" : "Do check-in"}
        </Button>
      </section>
    </div>
  );
}
