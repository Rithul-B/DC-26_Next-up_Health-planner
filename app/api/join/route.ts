import { dbAvailable, prisma } from "@/lib/db";
import { normalizeJoinCode } from "@/lib/join-code";
import { verifyPassword } from "@/lib/password";
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
    code?: string;
    name?: string;
    password?: string;
    role?: Role;
    talkStyle?: TalkStyle;
    personId?: string;
    addPerson?: boolean;
  } | null;

  const code = normalizeJoinCode(body?.code ?? "");
  const name = body?.name?.trim();
  if (!code || !name) {
    return NextResponse.json(
      { error: "Need the house code and your first name." },
      { status: 400 },
    );
  }

  const household = await prisma.household.findUnique({
    where: { joinCode: code },
    include: { people: { orderBy: { sortOrder: "asc" } } },
  });
  if (!household) {
    return NextResponse.json(
      { error: "No house uses that code." },
      { status: 404 },
    );
  }

  if (household.passwordHash) {
    const password = body?.password?.trim() ?? "";
    if (!password || !verifyPassword(password, household.passwordHash)) {
      return NextResponse.json(
        { error: "That password does not match this house." },
        { status: 401 },
      );
    }
  }

  const role: Role = body?.role === "helper" ? "helper" : "person";
  let personId = body?.personId ?? household.people[0]?.id;

  if (body?.addPerson || !personId) {
    personId = crypto.randomUUID();
    await prisma.person.create({
      data: {
        id: personId,
        householdId: household.id,
        name,
        talkStyle: body?.talkStyle ?? "plain",
        sortOrder: household.people.length,
      },
    });
  } else if (
    personId &&
    !household.people.some((person) => person.id === personId)
  ) {
    return NextResponse.json(
      { error: "That person is not in this house." },
      { status: 400 },
    );
  }

  let member = await prisma.member.findFirst({
    where: { householdId: household.id, name },
  });
  if (!member) {
    member = await prisma.member.create({
      data: {
        householdId: household.id,
        name,
        role,
        personId,
      },
    });
  } else {
    member = await prisma.member.update({
      where: { id: member.id },
      data: { role, personId },
    });
  }

  await createSession({
    householdId: household.id,
    memberId: member.id,
    personId: personId!,
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
