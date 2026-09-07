import { dbAvailable, prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { vapidConfigured } from "@/lib/vapid";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "On this device only." }, { status: 503 });
  }
  const session = await currentSession();
  const userId = session?.member.userId;
  if (!session || !userId) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
  if (!vapidConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: "Web Push is not set up. This browser can still show alerts while Next Up is open.",
    });
  }

  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;

  const endpoint = body?.endpoint?.trim();
  const p256dh = body?.keys?.p256dh?.trim();
  const auth = body?.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "That push subscribe did not look right." }, { status: 400 });
  }

  await prisma.pushSub.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId, p256dh, auth },
  });

  return NextResponse.json({ ok: true, configured: true });
}

export async function DELETE(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json({ ok: true });
  }
  const session = await currentSession();
  const userId = session?.member.userId;
  if (!userId) {
    return NextResponse.json({ ok: true });
  }
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (body?.endpoint) {
    await prisma.pushSub.deleteMany({ where: { endpoint: body.endpoint, userId } });
  } else {
    await prisma.pushSub.deleteMany({ where: { userId } });
  }
  return NextResponse.json({ ok: true });
}
