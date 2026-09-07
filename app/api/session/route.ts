import { dbAvailable, prisma } from "@/lib/db";
import { currentSession } from "@/lib/session";
import { sessionBundle } from "@/lib/auth-payload";
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
    viewEveryone?: boolean;
  } | null;

  const role: Role | undefined =
    body?.role === "helper" || body?.role === "person" ? body.role : undefined;
  const personId = body?.personId;
  const member = await prisma.member.findUnique({ where: { id: session.memberId } });

  if (personId) {
    const person = await prisma.person.findFirst({
      where: { id: personId, householdId: session.householdId },
    });
    if (!person) {
      return NextResponse.json({ error: "That person is not here." }, { status: 400 });
    }
    if (member && !member.isHead && !member.viewEveryone && personId !== session.personId) {
      return NextResponse.json(
        { error: "You chose to see only your list." },
        { status: 403 },
      );
    }
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      ...(role ? { role } : {}),
      ...(personId ? { personId } : {}),
    },
  });

  if (typeof body?.viewEveryone === "boolean" && member && !member.isHead) {
    await prisma.member.update({
      where: { id: member.id },
      data: { viewEveryone: body.viewEveryone },
    });
  }

  return NextResponse.json({ ok: true, ...(await sessionBundle()) });
}
