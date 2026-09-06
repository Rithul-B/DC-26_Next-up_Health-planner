import { dbAvailable, prisma } from "@/lib/db";
import { clearSessionCookie, readSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = await readSessionCookie();
  await clearSessionCookie();
  if (token && (await dbAvailable())) {
    await prisma.session.delete({ where: { id: token } }).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
