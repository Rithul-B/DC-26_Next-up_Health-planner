import { todayKey } from "@/lib/dates";
import type { DueAlert } from "@/lib/alerts";

const PING_KEY = "next-up-pings-v1";

function loadPings(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PING_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function savePings(map: Record<string, string>) {
  localStorage.setItem(PING_KEY, JSON.stringify(map));
}

export async function requestReminderPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function pingDueAlerts(alerts: DueAlert[]) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  const day = todayKey();
  const seen = loadPings();
  let changed = false;
  for (const alert of alerts) {
    if (seen[alert.id] === day) continue;
    try {
      new Notification("Next Up", {
        body: `${alert.title}. ${alert.detail}.`,
        tag: alert.id,
      });
      seen[alert.id] = day;
      changed = true;
    } catch {
      break;
    }
  }
  if (changed) savePings(seen);
}
