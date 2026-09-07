import { dbAvailable, prisma } from "@/lib/db";
import { emailLooksOk, normalizeEmail } from "@/lib/email";
import { randomJoinCode } from "@/lib/join-code";
import { MAX_HOUSEHOLD_PEOPLE, MIN_PASSWORD_LENGTH } from "@/lib/limits";
import { addMemberToHousehold, cleanPersonInput } from "@/lib/members";
import { hashPassword, verifyPassword } from "@/lib/password";
import { serializeReasons } from "@/lib/reasons";
import { createSession } from "@/lib/session";
import { sessionBundle } from "@/lib/auth-payload";
import type { Role, TalkStyle } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  role?: Role;
  firstName?: string;
  email?: string;
  password?: string;
  householdName?: string;
  reasons?: string[];
  age?: number | null;
  weightNote?: string | null;
  heightNote?: string | null;
  conditions?: string | null;
  extraNotes?: string | null;
  talkStyle?: TalkStyle;
  people?: {
    firstName?: string;
    email?: string;
    age?: number | null;
    weightNote?: string | null;
    heightNote?: string | null;
    conditions?: string | null;
    extraNotes?: string | null;
    talkStyle?: TalkStyle;
    role?: Role;
  }[];
};

export async function POST(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json(
      { error: "Saved on this device only. Shared login is not available." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const firstName = body?.firstName?.trim() ?? "";
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password?.trim() ?? "";
  if (!firstName) {
    return NextResponse.json({ error: "Need your first name." }, { status: 400 });
  }
  if (!emailLooksOk(email)) {
    return NextResponse.json({ error: "Need an email that looks real." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password needs at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const others = body?.people ?? [];
  if (1 + others.length > MAX_HOUSEHOLD_PEOPLE) {
    return NextResponse.json(
      {
        error: `A household can have ${MAX_HOUSEHOLD_PEOPLE} people, including you.`,
      },
      { status: 400 },
    );
  }

  const emails = [email, ...others.map((row) => normalizeEmail(row.email ?? ""))];
  if (new Set(emails).size !== emails.length) {
    return NextResponse.json(
      { error: "Each person needs their own email." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (existing?.memberships.length) {
    return NextResponse.json(
      { error: "That email is already in a household. Leave it first, or log in." },
      { status: 409 },
    );
  }
  if (existing?.passwordHash && !verifyPassword(password, existing.passwordHash)) {
    return NextResponse.json(
      {
        error:
          "That email already has an account. Use the same password, or log in.",
      },
      { status: 401 },
    );
  }

  const role: Role = body?.role === "helper" ? "helper" : "person";
  const householdName =
    body?.householdName?.trim() || `${firstName}’s house`;

  let joinCode = randomJoinCode();
  for (let i = 0; i < 8; i += 1) {
    const clash = await prisma.household.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = randomJoinCode();
  }

  const passwordHash = hashPassword(password);
  const headUser = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          reasons: serializeReasons(body?.reasons ?? []),
        },
      })
    : await prisma.user.create({
        data: {
          email,
          passwordHash,
          reasons: serializeReasons(body?.reasons ?? []),
        },
      });

  const household = await prisma.household.create({
    data: {
      name: householdName,
      joinCode,
      headUserId: headUser.id,
    },
  });

  const headPersonId = crypto.randomUUID();
  await prisma.person.create({
    data: {
      id: headPersonId,
      householdId: household.id,
      name: firstName,
      talkStyle: body?.talkStyle ?? "plain",
      sortOrder: 0,
      age: body?.age ?? null,
      weightNote: body?.weightNote?.trim() || null,
      heightNote: body?.heightNote?.trim() || null,
      conditions: body?.conditions?.trim() || null,
      extraNotes: body?.extraNotes?.trim() || null,
    },
  });

  const headMember = await prisma.member.create({
    data: {
      householdId: household.id,
      userId: headUser.id,
      name: firstName,
      role,
      personId: headPersonId,
      isHead: true,
      viewEveryone: true,
      claimedAt: new Date(),
    },
  });

  for (const [index, row] of others.entries()) {
    const cleaned = cleanPersonInput({
      firstName: row.firstName ?? "",
      email: row.email ?? "",
      age: row.age,
      weightNote: row.weightNote,
      heightNote: row.heightNote,
      conditions: row.conditions,
      extraNotes: row.extraNotes,
      talkStyle: row.talkStyle,
      role: row.role,
    });
    if (typeof cleaned === "string") {
      await prisma.household.delete({ where: { id: household.id } }).catch(() => null);
      return NextResponse.json({ error: cleaned }, { status: 400 });
    }
    const added = await addMemberToHousehold({
      householdId: household.id,
      householdName,
      headName: firstName,
      person: cleaned,
      sortOrder: index + 1,
    });
    if ("error" in added) {
      await prisma.household.delete({ where: { id: household.id } }).catch(() => null);
      return NextResponse.json({ error: added.error }, { status: 400 });
    }
  }

  await createSession({
    householdId: household.id,
    memberId: headMember.id,
    personId: headPersonId,
    role,
  });

  const payload = await sessionBundle();
  return NextResponse.json(payload);
}
