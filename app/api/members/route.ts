import { sessionBundle } from "@/lib/auth-payload";
import { dbAvailable, prisma } from "@/lib/db";
import { addMemberToHousehold, cleanPersonInput, transferHeadIfNeeded } from "@/lib/members";
import { currentSession } from "@/lib/session";
import { listInvites } from "@/lib/snapshot";
import type { Role, TalkStyle } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "On this device only." }, { status: 503 });
  }
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
  const member = await prisma.member.findUnique({ where: { id: session.memberId } });
  if (!member?.isHead) {
    return NextResponse.json({ error: "Only the head can see invite codes." }, { status: 403 });
  }
  return NextResponse.json({ invites: await listInvites(session.householdId) });
}

export async function POST(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "On this device only." }, { status: 503 });
  }
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
  const actor = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: { household: true },
  });
  if (!actor?.isHead) {
    return NextResponse.json(
      { error: "Only the person who started this house can add people." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    firstName?: string;
    email?: string;
    age?: number | null;
    weightNote?: string | null;
    heightNote?: string | null;
    conditions?: string | null;
    extraNotes?: string | null;
    talkStyle?: TalkStyle;
    role?: Role;
  } | null;

  const cleaned = cleanPersonInput({
    firstName: body?.firstName ?? "",
    email: body?.email ?? "",
    age: body?.age,
    weightNote: body?.weightNote,
    heightNote: body?.heightNote,
    conditions: body?.conditions,
    extraNotes: body?.extraNotes,
    talkStyle: body?.talkStyle,
    role: body?.role,
  });
  if (typeof cleaned === "string") {
    return NextResponse.json({ error: cleaned }, { status: 400 });
  }

  const sortOrder = await prisma.person.count({
    where: { householdId: session.householdId },
  });
  const added = await addMemberToHousehold({
    householdId: session.householdId,
    householdName: actor.household.name,
    headName: actor.name,
    person: cleaned,
    sortOrder,
  });
  if ("error" in added) {
    return NextResponse.json({ error: added.error }, { status: 400 });
  }

  return NextResponse.json({
    ...(await sessionBundle()),
    added,
  });
}

export async function DELETE(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "On this device only." }, { status: 503 });
  }
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
  const actor = await prisma.member.findUnique({ where: { id: session.memberId } });
  if (!actor?.isHead) {
    return NextResponse.json(
      { error: "Only the person who started this house can remove someone." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { memberId?: string } | null;
  const memberId = body?.memberId;
  if (!memberId) {
    return NextResponse.json({ error: "Need which person to remove." }, { status: 400 });
  }
  if (memberId === actor.id) {
    return NextResponse.json(
      { error: "Use Leave this house if you want to leave." },
      { status: 400 },
    );
  }

  const target = await prisma.member.findFirst({
    where: { id: memberId, householdId: session.householdId },
  });
  if (!target) {
    return NextResponse.json({ error: "That person is not in this house." }, { status: 404 });
  }

  await prisma.session.deleteMany({ where: { memberId: target.id } }).catch(() => null);
  await transferHeadIfNeeded(session.householdId, target.id);
  await prisma.member.delete({ where: { id: target.id } }).catch(() => null);
  if (target.personId) {
    await prisma.person.delete({ where: { id: target.personId } }).catch(() => null);
  }

  return NextResponse.json(await sessionBundle());
}
