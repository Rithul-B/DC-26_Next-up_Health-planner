import { todayKey } from "@/lib/dates";
import type { FamilyRecord } from "@/lib/types";
import { WHOLE_FAMILY } from "@/lib/types";

/** Old hardcoded demo dates (Dad’s physical ~178 days overdue as of Sep 2026). */
export const STALE_DEMO_FAMILY: Record<string, { lastDone: string; due: string }> =
  {
    "flu-all": { lastDone: "2025-10-18", due: "2026-10-15" },
    "dad-physical": { lastDone: "2025-03-12", due: "2026-03-12" },
    "sam-dentist": { lastDone: "2026-06-08", due: "2026-12-08" },
    "you-eyes": { lastDone: "2026-04-22", due: "2027-04-22" },
  };

export function shiftIso(days: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

export function demoFamilyRecords(from = new Date()): FamilyRecord[] {
  return [
    {
      id: "flu-all",
      kind: "vaccine",
      who: WHOLE_FAMILY,
      lastDone: shiftIso(-323, from),
      due: shiftIso(39, from),
      note: "Everyone. Same clinic as last year.",
    },
    {
      id: "dad-physical",
      kind: "checkup",
      who: "dad",
      lastDone: shiftIso(-365, from),
      due: shiftIso(12, from),
      note: "Annual physical. Ask for the blood work printout.",
    },
    {
      id: "sam-dentist",
      kind: "dentist",
      who: "sam",
      lastDone: shiftIso(-90, from),
      due: shiftIso(93, from),
      note: "Cleaning. Just a name on the board.",
    },
    {
      id: "you-eyes",
      kind: "eyes",
      who: "you",
      lastDone: shiftIso(-137, from),
      due: shiftIso(228, from),
      note: "All clear this year.",
    },
  ];
}

export function looksLikeSamplePeople(
  people: { id: string }[] | undefined,
): boolean {
  if (!people?.length) return false;
  const ids = new Set(people.map((person) => person.id));
  return ids.has("you") && ids.has("dad") && ids.has("sam");
}

export function isStaleDemoFamilyRow(row: {
  id: string;
  lastDone: string;
  due: string;
}): boolean {
  const stale = STALE_DEMO_FAMILY[row.id];
  return Boolean(stale && stale.lastDone === row.lastDone && stale.due === row.due);
}

export function refreshStaleFamily(family: FamilyRecord[]): FamilyRecord[] {
  const fresh = demoFamilyRecords();
  const byId = new Map(fresh.map((row) => [row.id, row]));
  let changed = false;
  const next = family.map((row) => {
    if (!isStaleDemoFamilyRow(row)) return row;
    const update = byId.get(row.id);
    if (!update) return row;
    changed = true;
    return { ...row, lastDone: update.lastDone, due: update.due };
  });
  return changed ? next : family;
}
