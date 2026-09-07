import { randomJoinCode } from "@/lib/join-code";

export function randomInviteCode(): string {
  return `IN-${randomJoinCode(6)}`;
}

export function normalizeInviteCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}
