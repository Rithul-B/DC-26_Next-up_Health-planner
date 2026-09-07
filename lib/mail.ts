import nodemailer from "nodemailer";
import { normalizeEmail } from "@/lib/email";

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

export async function sendInviteEmail(input: {
  to: string;
  householdName: string;
  inviteCode: string;
  headName: string;
}): Promise<boolean> {
  if (!smtpConfigured()) return false;

  const to = normalizeEmail(input.to);
  const from = process.env.SMTP_FROM!.trim();
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const subject = `${input.headName} invited you to ${input.householdName} on Next Up`;
  const text = [
    `Hi,`,
    ``,
    `${input.headName} added you to ${input.householdName} in Next Up.`,
    ``,
    `Your one-time invite code: ${input.inviteCode}`,
    ``,
    `Open Next Up, choose Log in, then Claim invite. Use this email and that code. Then set your own password.`,
    ``,
    `If you did not expect this, you can ignore it.`,
    ``,
    `Next Up is a planner, not medical care.`,
  ].join("\n");

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
    await transporter.sendMail({ from, to, subject, text });
    return true;
  } catch {
    return false;
  }
}

