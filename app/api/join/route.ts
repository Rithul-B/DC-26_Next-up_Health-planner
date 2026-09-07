import { sessionBundle } from "@/lib/auth-payload";
import { dbAvailable, prisma } from "@/lib/db";
import { emailLooksOk, normalizeEmail } from "@/lib/email";
import { normalizeJoinCode } from "@/lib/join-code";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { DEMO_JOIN_CODE } from "@/lib/types";
import type { Role } from "@/lib/types";
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
    email?: string;
    password?: string;
    role?: Role;
  } | null;

  const code = normalizeJoinCode(body?.code ?? "");
  if (!code) {
    return NextResponse.json({ error: "Need the house code." }, { status: 400 });
  }

  const household = await prisma.household.findUnique({
    where: { joinCode: code },
    include: { people: { orderBy: { sortOrder: "asc" } }, members: true },
  });
  if (!household) {
    return NextResponse.json(
      { error: "No house uses that code." },
      { status: 404 },
    );
  }

  // Sample house stays join-code only so a first visit is not empty.
  if (code === DEMO_JOIN_CODE) {
    if (household.passwordHash) {
      const password = body?.password?.trim() ?? "";
      if (!password || !verifyPassword(password, household.passwordHash)) {
        return NextResponse.json(
          { error: "That password does not match this house." },
          { status: 401 },
        );
      }
    }
    const member =
      household.members.find((row) => row.name === "You") ?? household.members[0];
    if (!member) {
      return NextResponse.json({ error: "Sample house is empty." }, { status: 500 });
    }
    await createSession({
      householdId: household.id,
      memberId: member.id,
      personId: member.personId ?? "you",
      role: "person",
    });
    return NextResponse.json(await sessionBundle());
  }

  const email = normalizeEmail(body?.email ?? "");
  if (!emailLooksOk(email)) {
    return NextResponse.json(
      {
        error:
          "This house uses email. Ask the person who started it to add your email, then claim your invite — or log in if you already did.",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "That email is not in this house. Ask the head to add you." },
      { status: 404 },
    );
  }

  const member = user.memberships.find((row) => row.householdId === household.id);
  if (!member) {
    if (user.memberships.length > 0) {
      return NextResponse.json(
        { error: "That email is already in another household. Leave it first." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "That email is not in this house. Ask the head to add you." },
      { status: 404 },
    );
  }

  if (!member.claimedAt || !user.passwordHash) {
    return NextResponse.json(
      {
        error: "This email still needs the invite code. Use Claim invite on the log-in screen.",
        needsClaim: true,
      },
      { status: 401 },
    );
  }

  const password = body?.password?.trim() ?? "";
  if (!password || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "That password does not match." },
      { status: 401 },
    );
  }

  const role: Role = body?.role === "helper" || member.role === "helper" ? "helper" : "person";
  await createSession({
    householdId: household.id,
    memberId: member.id,
    personId: member.personId ?? household.people[0]?.id ?? "",
    role,
  });

  return NextResponse.json(await sessionBundle());
}
