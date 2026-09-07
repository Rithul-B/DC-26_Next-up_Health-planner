export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function emailLooksOk(raw: string): boolean {
  const email = normalizeEmail(raw);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
