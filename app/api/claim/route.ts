import { sessionBundle } from "@/lib/auth-payload";
import { dbAvailable, prisma } from "@/lib/db";
import { emailLooksOk, normalizeEmail } from "@/lib/email";
import { normalizeInviteCode } from "@/lib/invite";
import { MIN_PASSWORD_LENGTH } from "@/lib/limits";
import { hashPassword } from "@/lib/password";
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
    inviteCode?: string;
    password?: string;
    viewEveryone?: boolean;
  } | null;

  const email = normalizeEmail(body?.email ?? "");
  const inviteCode = normalizeInviteCode(body?.inviteCode ?? "");
  const password = body?.password?.trim() ?? "";
  if (!emailLooksOk(email) || !inviteCode) {
    return NextResponse.json(
      { error: "Need your email and the invite code." },
      { status: 400 },
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password needs at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "No invite uses that email." },
      { status: 404 },
    );
  }

  const member = user.memberships.find(
    (row) => row.inviteCode && normalizeInviteCode(row.inviteCode) === inviteCode,
  );
  if (!member) {
    return NextResponse.json(
      { error: "That invite code does not match this email." },
      { status: 401 },
    );
  }
  if (member.claimedAt && user.passwordHash) {
    return NextResponse.json(
      { error: "This invite was already used. Log in with your password." },
      { status: 409 },
    );
  }

  const viewEveryone = body?.viewEveryone !== false;
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(password) },
  });
  await prisma.member.update({
    where: { id: member.id },
    data: {
      claimedAt: new Date(),
      viewEveryone: member.isHead ? true : viewEveryone,
      inviteCode: null,
    },
  });

  const role = member.role === "helper" ? "helper" : "person";
  await createSession({
    householdId: member.householdId,
    memberId: member.id,
    personId: member.personId ?? "",
    role,
  });

  return NextResponse.json(await sessionBundle());
}
