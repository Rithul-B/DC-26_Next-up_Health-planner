export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatShort(iso: string): string {
  return parseDate(iso).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function formatDay(iso: string): string {
  return parseDate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(iso: string, from = new Date()): number {
  const a = parseDate(todayKey(from)).getTime();
  const b = parseDate(iso).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function isDueSoon(iso: string): boolean {
  const days = daysUntil(iso);
  return days <= 45;
}

export function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return `Overdue by ${Math.abs(days)} days`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 45) return `Due in ${days} days`;
  return `Due ${formatShort(iso)}`;
}

export function completionKey(personId: string, day = todayKey()): string {
  return `${personId}:${day}`;
}
