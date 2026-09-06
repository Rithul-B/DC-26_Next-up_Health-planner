import { dbAvailable } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { householdPublic, readSnapshot, writeSnapshot } from "@/lib/snapshot";
import type { HouseholdSnapshot } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await dbAvailable())) {
    return NextResponse.json({ db: false }, { status: 503 });
  }
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
  return NextResponse.json({
    db: true,
    household: householdPublic(session.household),
    state: await readSnapshot(session.householdId),
    role: session.role,
    personId: session.personId,
    memberName: session.member.name,
  });
}

export async function PUT(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "On this device only." }, { status: 503 });
  }
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as HouseholdSnapshot | null;
  if (!body || !Array.isArray(body.people) || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "That save did not look right." }, { status: 400 });
  }

  await writeSnapshot(session.householdId, {
    people: body.people,
    items: body.items,
    completions: body.completions ?? {},
    postponed: body.postponed ?? {},
    checkIns: body.checkIns ?? {},
    family: body.family ?? [],
  });

  return NextResponse.json({
    ok: true,
    state: await readSnapshot(session.householdId),
  });
}
