import { sessionBundle } from "@/lib/auth-payload";
import { dbAvailable, prisma } from "@/lib/db";
import { transferHeadIfNeeded } from "@/lib/members";
import { clearSessionCookie, currentSession, readSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await dbAvailable())) {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  const session = await currentSession();
  const token = await readSessionCookie();
  await clearSessionCookie();

  if (session) {
    const memberId = session.memberId;
    const householdId = session.householdId;
    const userId = session.member.userId;
    await prisma.session.deleteMany({ where: { memberId } }).catch(() => null);
    await transferHeadIfNeeded(householdId, memberId);
    const stillThere = await prisma.household.findUnique({
      where: { id: householdId },
    });
    if (stillThere) {
      await prisma.member.delete({ where: { id: memberId } }).catch(() => null);
    }
    // Keep the User so the email can join a new house later.
    void userId;
  } else if (token) {
    await prisma.session.delete({ where: { id: token } }).catch(() => null);
  }

  return NextResponse.json({ ok: true, left: true });
}

export async function GET() {
  const payload = await sessionBundle();
  if (!payload) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
  return NextResponse.json(payload);
}
