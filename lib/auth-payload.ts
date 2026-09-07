import { prisma } from "@/lib/db";
import { parseReasons } from "@/lib/reasons";
import { currentSession } from "@/lib/session";
import {
  filterSnapshot,
  householdPublic,
  listInvites,
  readSnapshot,
} from "@/lib/snapshot";
import { smtpConfigured } from "@/lib/mail";
import type { Role } from "@/lib/types";

export async function sessionBundle() {
  const session = await currentSession();
  if (!session) return null;

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: { user: true, household: true },
  });
  if (!member) return null;

  const isHead =
    member.isHead ||
    Boolean(member.userId && member.household.headUserId === member.userId);
  const viewEveryone = isHead ? true : member.viewEveryone;
  const full = await readSnapshot(session.householdId);
  const state = filterSnapshot(full, session.personId, viewEveryone, isHead);
  const invites = isHead ? await listInvites(session.householdId) : [];

  return {
    household: householdPublic(session.household),
    state,
    role: (session.role === "helper" ? "helper" : "person") as Role,
    personId: session.personId,
    memberName: member.name,
    isHead,
    viewEveryone,
    email: member.user?.email ?? null,
    memberId: member.id,
    userId: member.userId,
    reasons: parseReasons(member.user?.reasons),
    invites,
    mailSent: smtpConfigured(),
  };
}
