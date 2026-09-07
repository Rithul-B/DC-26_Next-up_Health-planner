import { vapidConfigured, vapidPublicKey } from "@/lib/vapid";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = vapidPublicKey();
  return NextResponse.json({
    configured: vapidConfigured(),
    publicKey,
  });
}
