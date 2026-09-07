export const NEED_REASONS = [
  {
    id: "checkups",
    label: "Needs and checkups",
    hint: "Keep visits and follow-ups in one place.",
  },
  {
    id: "reminders",
    label: "Checkup reminders",
    hint: "A nudge when something is due soon.",
  },
  {
    id: "advice",
    label: "Calm advice",
    hint: "Tips and when to talk to a clinician. Not a diagnosis.",
  },
  {
    id: "meds",
    label: "Medicine notes",
    hint: "Remember what you take. We will not tell you a dose.",
  },
] as const;

export type NeedReasonId = (typeof NEED_REASONS)[number]["id"];

export function parseReasons(raw: string | null | undefined): NeedReasonId[] {
  if (!raw) return [];
  const allowed = new Set(NEED_REASONS.map((row) => row.id));
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is NeedReasonId => allowed.has(part as NeedReasonId));
}

export function serializeReasons(ids: string[]): string {
  const allowed = new Set(NEED_REASONS.map((row) => row.id));
  return ids.filter((id) => allowed.has(id as NeedReasonId)).join(",");
}
