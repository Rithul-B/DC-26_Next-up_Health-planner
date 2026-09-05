import { completionKey, todayKey } from "@/lib/dates";
import type { AppState, TimeOfDay, Weight } from "@/lib/types";

export function clockPeriod(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export type HouseholdRow = {
  id: string;
  name: string;
  waiting: number;
  hasCritical: boolean;
};

export function householdRows(state: AppState, day = todayKey()): HouseholdRow[] {
  return state.people.map((person) => {
    const done = new Set(state.completions[completionKey(person.id, day)] ?? []);
    const later = new Set(state.postponed[completionKey(person.id, day)] ?? []);
    const waiting = state.items.filter(
      (item) =>
        item.personId === person.id && !done.has(item.id) && !later.has(item.id),
    );
    return {
      id: person.id,
      name: person.name,
      waiting: waiting.length,
      hasCritical: waiting.some((item) => item.weight === "critical"),
    };
  });
}

export function personTint(id: string): "you" | "dad" | "sam" | "other" {
  if (id === "you") return "you";
  if (id === "dad") return "dad";
  if (id === "sam") return "sam";
  return "other";
}

export function weightTone(weight: Weight): "warm" | "clean" | "quiet" {
  if (weight === "critical") return "quiet";
  if (weight === "important") return "clean";
  return "warm";
}
