import { dbAvailable, prisma } from "@/lib/db";
import { ensureDemoHousehold } from "@/lib/demo-seed";
import { createSession } from "@/lib/session";
import { householdPublic, readSnapshot } from "@/lib/snapshot";
import { DEMO_JOIN_CODE } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await dbAvailable())) {
    return NextResponse.json(
      { error: "Saved on this device only. The sample house is not available." },
      { status: 503 },
    );
  }

  const household = await ensureDemoHousehold();
  const member =
    (await prisma.member.findFirst({
      where: { householdId: household.id, name: "You" },
    })) ??
    (await prisma.member.create({
      data: {
        householdId: household.id,
        name: "You",
        role: "person",
        personId: "you",
      },
    }));

  await createSession({
    householdId: household.id,
    memberId: member.id,
    personId: member.personId ?? "you",
    role: "person",
  });

  return NextResponse.json({
    household: householdPublic({
      ...household,
      joinCode: household.joinCode || DEMO_JOIN_CODE,
    }),
    state: await readSnapshot(household.id),
    role: "person",
    personId: member.personId ?? "you",
    memberName: member.name,
  });
}
