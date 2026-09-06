import { familyKindLabels } from "@/lib/copy";
import { daysUntil, dueLabel } from "@/lib/dates";
import type { AppState } from "@/lib/types";
import { WHOLE_FAMILY } from "@/lib/types";

export type DueAlert = {
  id: string;
  title: string;
  detail: string;
  href: string;
  level: "due" | "soon";
};

function whoName(state: AppState, who: string): string {
  if (who === WHOLE_FAMILY) return "Everyone";
  return state.people.find((person) => person.id === who)?.name ?? "Someone";
}

export function dueAlerts(state: AppState): DueAlert[] {
  const alerts: DueAlert[] = [];

  for (const row of state.family) {
    const days = daysUntil(row.due);
    if (days > 3) continue;
    alerts.push({
      id: `family-${row.id}`,
      title: `${familyKindLabels[row.kind]} · ${whoName(state, row.who)}`,
      detail: dueLabel(row.due),
      href: "/family",
      level: days <= 0 ? "due" : "soon",
    });
  }

  for (const item of state.items) {
    if (!item.due) continue;
    const days = daysUntil(item.due);
    if (days > 3) continue;
    const name =
      state.people.find((person) => person.id === item.personId)?.name ??
      "Someone";
    alerts.push({
      id: `item-${item.id}`,
      title: `${item.title} · ${name}`,
      detail: dueLabel(item.due),
      href: `/item/${item.id}`,
      level: days <= 0 ? "due" : "soon",
    });
  }

  return alerts.sort((a, b) => {
    if (a.level !== b.level) return a.level === "due" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}
