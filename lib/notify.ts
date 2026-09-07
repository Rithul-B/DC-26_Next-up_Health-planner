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

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function enableDeviceNotifications(): Promise<string> {
  const allowed = await requestReminderPermission();
  if (!allowed) {
    return "This browser blocked notifications. Due banners still show in the app. A phone that is off or offline cannot ping you.";
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "In-app banners and this browser’s notifications are on while Next Up is open. Locked-screen Web Push needs a capable browser. Fully off or no network still cannot notify you.";
  }

  try {
    const cfgRes = await fetch("/api/push/config", { credentials: "same-origin" });
    const cfg = (await cfgRes.json()) as {
      configured?: boolean;
      publicKey?: string | null;
    };
    await navigator.serviceWorker.register("/sw.js");
    if (!cfg.configured || !cfg.publicKey) {
      return "Notifications on this device are on while the app or browser can show them. Web Push is not set up on the server yet (needs VAPID keys). A phone that is fully off or has no network still cannot notify you.";
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
    await fetch("/api/push/test", { method: "POST", credentials: "same-origin" });
    return "Web Push is on for this browser. Locked-screen alerts can work if the phone is on and has network. Fully off or offline still cannot notify you.";
  } catch {
    return "This browser allowed alerts while Next Up is open. Web Push did not finish. Fully off or no network still cannot notify you.";
  }
}
