import { prisma } from "@/lib/db";
import { dueAlerts } from "@/lib/alerts";
import { vapidConfigured, vapidPrivateKey, vapidPublicKey, vapidSubject } from "@/lib/vapid";
import { readSnapshot } from "@/lib/snapshot";

type PushPayload = { title: string; body: string; url?: string };

async function webpush() {
  const mod = (await import("web-push")) as {
    default?: {
      setVapidDetails: (s: string, pub: string, priv: string) => void;
      sendNotification: (
        sub: { endpoint: string; keys: { p256dh: string; auth: string } },
        payload: string,
      ) => Promise<unknown>;
    };
    setVapidDetails?: (s: string, pub: string, priv: string) => void;
    sendNotification?: (
      sub: { endpoint: string; keys: { p256dh: string; auth: string } },
      payload: string,
    ) => Promise<unknown>;
  };
  return mod.default ?? mod;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!vapidConfigured()) return;
  const pub = vapidPublicKey();
  const priv = vapidPrivateKey();
  if (!pub || !priv) return;

  const subs = await prisma.pushSub.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const push = await webpush();
  if (!push.setVapidDetails || !push.sendNotification) return;
  push.setVapidDetails(vapidSubject(), pub, priv);

  for (const sub of subs) {
    try {
      await push.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSub.delete({ where: { id: sub.id } }).catch(() => null);
      }
    }
  }
}

export async function pingHouseholdDue(householdId: string) {
  if (!vapidConfigured()) return;
  const snap = await readSnapshot(householdId);
  const alerts = dueAlerts({
    ...snap,
    activePersonId: snap.people[0]?.id ?? "you",
    role: "person",
    ease: {
      largeText: false,
      extraLargeText: false,
      highContrast: false,
      reduceMotion: false,
      reminders: true,
      fewWords: false,
      hideExtra: false,
    },
    sync: "household",
    dbAvailable: true,
    household: null,
    memberName: null,
    isHead: true,
    viewEveryone: true,
    email: null,
    memberId: null,
    userId: null,
    reasons: [],
    invites: [],
    mailSent: false,
  });
  if (alerts.length === 0) return;

  const members = await prisma.member.findMany({
    where: { householdId, userId: { not: null } },
  });
  const body =
    alerts.length === 1
      ? `${alerts[0].title}. ${alerts[0].detail}.`
      : `${alerts.length} things are due soon.`;

  for (const member of members) {
    if (!member.userId) continue;
    await sendPushToUser(member.userId, {
      title: "Next Up",
      body,
      url: alerts[0]?.href ?? "/",
    });
  }
}
