import type { PersonalItem, TimeOfDay } from "@/lib/types";

export function tonightWaiting(items: {
  postponed: PersonalItem[];
  remaining: PersonalItem[];
}): PersonalItem[] {
  if (items.postponed.length) return items.postponed;
  const later = items.remaining.filter(
    (item) => item.timeOfDay === "evening" || item.timeOfDay === "night",
  );
  return later;
}

export function isNightish(period: TimeOfDay): boolean {
  return period === "evening" || period === "night";
}
