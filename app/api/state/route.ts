import { sessionBundle } from "@/lib/auth-payload";
import { dbAvailable, prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import {
  filterSnapshot,
  householdPublic,
  mergeMemberSnapshot,
  readSnapshot,
  writeSnapshot,
} from "@/lib/snapshot";
import type { HouseholdSnapshot } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await dbAvailable())) {
    return NextResponse.json({ db: false }, { status: 503 });
  }
  const payload = await sessionBundle();
  if (!payload) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }
  return NextResponse.json({ db: true, ...payload });
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

  const member = await prisma.member.findUnique({ where: { id: session.memberId } });
  const isHead = Boolean(member?.isHead);
  const viewEveryone = isHead ? true : Boolean(member?.viewEveryone);
  const incoming: HouseholdSnapshot = {
    people: body.people,
    items: body.items,
    completions: body.completions ?? {},
    postponed: body.postponed ?? {},
    checkIns: body.checkIns ?? {},
    family: body.family ?? [],
    symptoms: body.symptoms ?? [],
  };

  const toWrite =
    isHead || viewEveryone
      ? incoming
      : mergeMemberSnapshot(
          await readSnapshot(session.householdId),
          incoming,
          session.personId,
        );

  await writeSnapshot(session.householdId, toWrite);

  const full = await readSnapshot(session.householdId);
  return NextResponse.json({
    ok: true,
    state: filterSnapshot(full, session.personId, viewEveryone, isHead),
    household: householdPublic(session.household),
  });
}
