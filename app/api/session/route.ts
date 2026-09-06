import { dbAvailable, prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import type { Role } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "On this device only." }, { status: 503 });
  }
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    role?: Role;
    personId?: string;
  } | null;

  const role: Role | undefined =
    body?.role === "helper" || body?.role === "person" ? body.role : undefined;
  const personId = body?.personId;

  if (personId) {
    const person = await prisma.person.findFirst({
      where: { id: personId, householdId: session.householdId },
    });
    if (!person) {
      return NextResponse.json({ error: "That person is not here." }, { status: 400 });
    }
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      ...(role ? { role } : {}),
      ...(personId ? { personId } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
