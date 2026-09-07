export function vapidPublicKey(): string | null {
  const key =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    process.env.VAPID_PUBLIC_KEY?.trim() ||
    "";
  return key || null;
}

export function vapidPrivateKey(): string | null {
  const key = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  return key || null;
}

export function vapidSubject(): string {
  return process.env.VAPID_SUBJECT?.trim() || "mailto:next-up@localhost";
}

export function vapidConfigured(): boolean {
  return Boolean(vapidPublicKey() && vapidPrivateKey());
}
