import { dbAvailable } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { householdPublic, readSnapshot } from "@/lib/snapshot";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await dbAvailable();
  if (!db) {
    return NextResponse.json({ db: false, session: null });
  }

  try {
    const session = await currentSession();
    if (!session) {
      return NextResponse.json({ db: true, session: null });
    }

    const snap = await readSnapshot(session.householdId);
    return NextResponse.json({
      db: true,
      session: {
        role: session.role,
        personId: session.personId,
        memberName: session.member.name,
        household: householdPublic(session.household),
      },
      state: snap,
    });
  } catch {
    return NextResponse.json({ db: false, session: null });
  }
}
