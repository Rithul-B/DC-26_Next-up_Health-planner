import { prisma } from "@/lib/db";
import { emailLooksOk, normalizeEmail } from "@/lib/email";
import { randomInviteCode } from "@/lib/invite";
import { MAX_HOUSEHOLD_PEOPLE } from "@/lib/limits";
import { sendInviteEmail, smtpConfigured } from "@/lib/mail";
import type { Role, TalkStyle } from "@/lib/types";

export type NewPersonInput = {
  firstName: string;
  email: string;
  age?: number | null;
  weightNote?: string | null;
  heightNote?: string | null;
  conditions?: string | null;
  extraNotes?: string | null;
  talkStyle?: TalkStyle;
  role?: Role;
};

export function cleanPersonInput(raw: NewPersonInput): NewPersonInput | string {
  const firstName = raw.firstName.trim();
  const email = normalizeEmail(raw.email);
  if (!firstName) return "Need a first name.";
  if (!emailLooksOk(email)) return "That email does not look right.";
  const age =
    raw.age === undefined || raw.age === null || Number.isNaN(Number(raw.age))
      ? null
      : Number(raw.age);
  if (age !== null && (age < 0 || age > 120)) return "Age should be a number of years.";
  return {
    firstName,
    email,
    age,
    weightNote: raw.weightNote?.trim() || null,
    heightNote: raw.heightNote?.trim() || null,
    conditions: raw.conditions?.trim() || null,
    extraNotes: raw.extraNotes?.trim() || null,
    talkStyle: raw.talkStyle ?? "plain",
    role: raw.role === "helper" ? "helper" : "person",
  };
}

export async function emailTakenMessage(email: string): Promise<string | null> {
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (!existing) return null;
  if (existing.memberships.length > 0) {
    return "That email is already in a household. They need to leave it first.";
  }
  return null;
}

export async function addMemberToHousehold(input: {
  householdId: string;
  householdName: string;
  headName: string;
  person: NewPersonInput;
  isHead?: boolean;
  passwordHash?: string | null;
  claimed?: boolean;
  sortOrder: number;
}): Promise<{ personId: string; memberId: string; userId: string; inviteCode: string | null; mailed: boolean } | { error: string }> {
  const cleaned = cleanPersonInput(input.person);
  if (typeof cleaned === "string") return { error: cleaned };

  const count = await prisma.person.count({ where: { householdId: input.householdId } });
  if (count >= MAX_HOUSEHOLD_PEOPLE) {
    return { error: `A household can have ${MAX_HOUSEHOLD_PEOPLE} people, including the person who started it.` };
  }

  const taken = await emailTakenMessage(cleaned.email);
  if (taken) return { error: taken };

  const personId = crypto.randomUUID();
  const inviteCode = input.claimed ? null : randomInviteCode();

  const existingUser = await prisma.user.findUnique({
    where: { email: cleaned.email },
    include: { memberships: true },
  });
  if (existingUser?.memberships.length) {
    return { error: "That email is already in a household. They need to leave it first." };
  }

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: cleaned.email,
        passwordHash: input.passwordHash ?? null,
      },
    }));
  if (existingUser && input.passwordHash) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash: input.passwordHash },
    });
  }

  await prisma.person.create({
    data: {
      id: personId,
      householdId: input.householdId,
      name: cleaned.firstName,
      talkStyle: cleaned.talkStyle ?? "plain",
      sortOrder: input.sortOrder,
      age: cleaned.age ?? null,
      weightNote: cleaned.weightNote,
      heightNote: cleaned.heightNote,
      conditions: cleaned.conditions,
      extraNotes: cleaned.extraNotes,
    },
  });

  const member = await prisma.member.create({
    data: {
      householdId: input.householdId,
      userId: user.id,
      name: cleaned.firstName,
      role: cleaned.role ?? "person",
      personId,
      isHead: Boolean(input.isHead),
      viewEveryone: true,
      inviteCode,
      claimedAt: input.claimed ? new Date() : null,
    },
  });

  let mailed = false;
  if (inviteCode && smtpConfigured()) {
    mailed = await sendInviteEmail({
      to: cleaned.email,
      householdName: input.householdName,
      inviteCode,
      headName: input.headName,
    });
  }

  return {
    personId,
    memberId: member.id,
    userId: user.id,
    inviteCode,
    mailed,
  };
}

export async function transferHeadIfNeeded(householdId: string, leavingMemberId: string) {
  const leaving = await prisma.member.findUnique({
    where: { id: leavingMemberId },
  });
  if (!leaving?.isHead) return;

  const next = await prisma.member.findFirst({
    where: { householdId, id: { not: leavingMemberId } },
    orderBy: { createdAt: "asc" },
  });
  if (!next) {
    await prisma.household.delete({ where: { id: householdId } }).catch(() => null);
    return;
  }
  await prisma.member.update({
    where: { id: next.id },
    data: { isHead: true },
  });
  await prisma.household.update({
    where: { id: householdId },
    data: { headUserId: next.userId },
  });
}
