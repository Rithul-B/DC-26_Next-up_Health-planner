import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "nu_session";
const DAY_MS = 86_400_000;
const SESSION_DAYS = 30;

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET || "next-up-local-dev-only";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function newSessionToken(): string {
  const raw = randomBytes(24).toString("hex");
  return `${raw}.${sign(raw)}`;
}

export function tokenLooksValid(token: string): boolean {
  const [raw, mac] = token.split(".");
  if (!raw || !mac) return false;
  const expected = sign(raw);
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function readSessionCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function writeSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Vercel is HTTPS. Local `npm start` is HTTP — a Secure cookie would be dropped.
    secure: process.env.VERCEL === "1",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function currentSession() {
  const token = await readSessionCookie();
  if (!token || !tokenLooksValid(token)) return null;
  const row = await prisma.session.findUnique({
    where: { id: token },
    include: {
      household: true,
      member: true,
    },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await prisma.session.delete({ where: { id: row.id } }).catch(() => null);
    }
    return null;
  }
  return row;
}

export async function createSession(input: {
  householdId: string;
  memberId: string;
  personId: string;
  role: Role;
}) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await prisma.session.create({
    data: {
      id: token,
      householdId: input.householdId,
      memberId: input.memberId,
      personId: input.personId,
      role: input.role,
      expiresAt,
    },
  });
  await writeSessionCookie(token, expiresAt);
  return token;
}
