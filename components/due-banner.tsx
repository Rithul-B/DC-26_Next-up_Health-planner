"use client";

import { dueAlerts } from "@/lib/alerts";
import { todayKey } from "@/lib/dates";
import { pingDueAlerts } from "@/lib/notify";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const HIDE_KEY = "next-up-alert-hide-v1";

export function DueBanner() {
  const { state } = useStore();
  const alerts = useMemo(() => dueAlerts(state), [state]);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIDE_KEY);
      const parsed = raw
        ? (JSON.parse(raw) as { day?: string; ids?: string[] })
        : null;
      if (parsed?.day === todayKey()) setHidden(parsed.ids ?? []);
      else setHidden([]);
    } catch {
      setHidden([]);
    }
  }, []);

  useEffect(() => {
    if (!state.ease.reminders) return;
    pingDueAlerts(alerts);
  }, [alerts, state.ease.reminders]);

  const visible = alerts.filter((alert) => !hidden.includes(alert.id));
  if (visible.length === 0) return null;

  function dismiss() {
    const ids = alerts.map((alert) => alert.id);
    setHidden(ids);
    localStorage.setItem(
      HIDE_KEY,
      JSON.stringify({ day: todayKey(), ids }),
    );
  }

  return (
    <div className="due-banner mb-6 rounded-3xl border px-5 py-4" role="status">
      <p className="text-sm font-medium text-muted-foreground">Due soon</p>
      <ul className="mt-2 space-y-2">
        {visible.map((alert) => (
          <li key={alert.id}>
            <Link href={alert.href} className="block text-lg font-semibold">
              {alert.title}
              <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                {alert.detail}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        className="mt-2 h-11 px-0 text-base"
        onClick={dismiss}
      >
        Hide for today
      </Button>
    </div>
  );
}
