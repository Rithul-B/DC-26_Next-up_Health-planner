import { dbAvailable, prisma } from "@/lib/db";
import { normalizeJoinCode } from "@/lib/join-code";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json({ db: false });
  }
  const url = new URL(request.url);
  const code = normalizeJoinCode(url.searchParams.get("code") ?? "");
  if (!code) {
    return NextResponse.json({ error: "Need a code." }, { status: 400 });
  }
  const household = await prisma.household.findUnique({
    where: { joinCode: code },
    include: { people: { orderBy: { sortOrder: "asc" } } },
  });
  if (!household) {
    return NextResponse.json({ error: "No house uses that code." }, { status: 404 });
  }
  return NextResponse.json({
    db: true,
    name: household.name,
    joinCode: household.joinCode,
    hasPassword: Boolean(household.passwordHash),
    people: household.people.map((person) => ({
      id: person.id,
      name: person.name,
    })),
  });
}
