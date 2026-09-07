import { sessionBundle } from "@/lib/auth-payload";
import { dbAvailable } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await dbAvailable();
  if (!db) {
    return NextResponse.json({ db: false, session: null });
  }

  try {
    const payload = await sessionBundle();
    if (!payload) {
      return NextResponse.json({ db: true, session: null });
    }
    return NextResponse.json({
      db: true,
      session: payload,
      state: payload.state,
    });
  } catch {
    return NextResponse.json({ db: false, session: null });
  }
}
