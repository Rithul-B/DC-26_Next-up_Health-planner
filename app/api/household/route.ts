import { dbAvailable, prisma } from "@/lib/db";
import { randomJoinCode } from "@/lib/join-code";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { householdPublic, readSnapshot } from "@/lib/snapshot";
import type { Role, TalkStyle } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json(
      { error: "Saved on this device only. The shared house is not available." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    householdName?: string;
    yourName?: string;
    password?: string;
    role?: Role;
    talkStyle?: TalkStyle;
  } | null;

  const householdName = body?.householdName?.trim();
  const yourName = body?.yourName?.trim();
  if (!householdName || !yourName) {
    return NextResponse.json(
      { error: "Need a house name and your first name." },
      { status: 400 },
    );
  }

  const role: Role = body?.role === "person" ? "person" : "helper";
  const talkStyle: TalkStyle = body?.talkStyle ?? "plain";
  const personId = crypto.randomUUID();

  let joinCode = randomJoinCode();
  for (let i = 0; i < 8; i += 1) {
    const clash = await prisma.household.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = randomJoinCode();
  }

  const household = await prisma.household.create({
    data: {
      name: householdName,
      joinCode,
      passwordHash: body?.password?.trim()
        ? hashPassword(body.password.trim())
        : null,
    },
  });

  await prisma.person.create({
    data: {
      id: personId,
      householdId: household.id,
      name: yourName,
      talkStyle,
      sortOrder: 0,
    },
  });

  const member = await prisma.member.create({
    data: {
      householdId: household.id,
      name: yourName,
      role,
      personId,
    },
  });

  await createSession({
    householdId: household.id,
    memberId: member.id,
    personId,
    role,
  });

  return NextResponse.json({
    household: householdPublic(household),
    state: await readSnapshot(household.id),
    role,
    personId,
    memberName: member.name,
  });
}
