import { sessionBundle } from "@/lib/auth-payload";
import { dbAvailable, prisma } from "@/lib/db";
import { emailLooksOk, normalizeEmail } from "@/lib/email";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await dbAvailable())) {
    return NextResponse.json(
      { error: "Saved on this device only. Shared login is not available." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password?.trim() ?? "";
  if (!emailLooksOk(email) || !password) {
    return NextResponse.json(
      { error: "Need your email and password." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: { include: { household: true } },
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: "No account uses that email." },
      { status: 404 },
    );
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error:
          "This email still needs to be claimed. Use the invite code from the person who added you.",
        needsClaim: true,
      },
      { status: 401 },
    );
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "That password does not match." },
      { status: 401 },
    );
  }

  const member = user.memberships[0];
  if (!member) {
    return NextResponse.json(
      {
        error:
          "You left your last household. Sign up again with this email and password to start a new house, or claim a new invite.",
        noHousehold: true,
      },
      { status: 409 },
    );
  }

  const role = member.role === "helper" ? "helper" : "person";
  await createSession({
    householdId: member.householdId,
    memberId: member.id,
    personId: member.personId ?? "",
    role,
  });

  return NextResponse.json(await sessionBundle());
}
