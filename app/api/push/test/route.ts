import { dbAvailable } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { currentSession } from "@/lib/session";
import { vapidConfigured } from "@/lib/vapid";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await dbAvailable())) {
    return NextResponse.json({ ok: false });
  }
  const session = await currentSession();
  const userId = session?.member.userId;
  if (!session || !userId || !vapidConfigured()) {
    return NextResponse.json({ ok: false, configured: vapidConfigured() });
  }
  await sendPushToUser(userId, {
    title: "Next Up",
    body: "Notifications are on for this browser. We will ping when something is due, if this device can receive it.",
    url: "/",
  });
  return NextResponse.json({ ok: true });
}
