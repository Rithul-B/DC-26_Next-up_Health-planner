# Next Up

An **Inclusive by Design** app (DC 2026): one health step at a time.

Personal routines (meds, today’s visits, check-ins) stay on **Now** and **Today**. Shared household checkups live in **Family**. Calm educational notes live in **Advice**.

The tone stays calm and simple, then gets quieter when a step is **Important** or **Critical**.

This is a planner. It is not a diagnosis, not a prescription, not a therapist, and not a medical device. We do not claim HIPAA.

## Sign up and family

- **Log in / Sign up first.** “This is for me” or “I’m a helper.”
- **Why you’re here** — checkups, reminders, advice, medicine notes (multi-select).
- **Family** — up to **6 people including the head**. First name, age, optional weight / height / conditions (free text, not a disease picker), optional notes.
- **Email** — the person who signs up is the **head**. Every member needs their own email. The same email cannot sit in two households unless they **leave** the first.
- **Sync** — login with email loads that person’s house. Non-head can choose **see everyone** or **only me**. That choice is saved.
- **Notifications** — in-app banners plus this browser’s Notification API. Locked-screen **Web Push** works if VAPID keys are set and the person allows it. A phone that is **fully off or has no network cannot notify**. We do not fake that.

Members claim a one-time invite code and set a password. If `SMTP_*` is set, we email the code. If not, the head sees the code on Family / Easier and can share it. We do not pretend mail was sent.

House join-codes still work as an extra (sample house `NEXTUP` is code-only). They do not bypass email uniqueness.

There is **no paid subscription**.

## Advice (safe)

- Symptom **journal** + “this is not a diagnosis” + red-flag “get urgent care if…”
- Common **care topics** (fever, missed dose — tell a pharmacist, not a script)
- Living-with-a-condition tips, not treatment
- Short guided pauses. Not therapy and not a replacement for a therapist.
- Nearby hospitals/pharmacies via browser location or city search (OpenStreetMap / Nominatim / Overpass). No fake GPS.

## Run locally

```bash
npm install
npm run dev
```

Optional Web Push keys:

```bash
npm run vapid
```

Paste the printed `VAPID_*` lines into `.env`.

Open [http://localhost:43127](http://localhost:43127).

Local data uses **SQLite** (`prisma/dev.db`) by default. Copy `.env.example` to `.env` if you want to set values yourself.

If the database cannot start, the app stays up on this device only (browser storage).

```bash
npm run build
npm start
```

## Vercel (live sync and push)

The site can stay on one device without secrets. **Phones will not share a house until Postgres is attached.**

We cannot set your Vercel environment from here. On [Vercel](https://vercel.com) for this project:

1. Open the project → **Storage** → create **Postgres** (or Neon) and attach it. That sets `DATABASE_URL`.
2. **Settings → Environment Variables** → add `SESSION_SECRET` (any long random string).
3. Optional for locked-screen Web Push: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (for example `mailto:you@example.com`). Generate with `npm run vapid`.
4. Optional invite email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Without these, invite codes show on the head’s Family screen.
5. **Deployments → Redeploy** the latest production deployment.

Build already runs `prisma generate` and `prisma db push`. After those steps, sign up on the live site. Family can log in with the emails you added.

Without `DATABASE_URL`, the live site still loads and keeps data in that browser. Without VAPID, in-app banners and the Notification API still work while the app is open.

## Stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma (SQLite locally, Postgres when `DATABASE_URL` is a Postgres URL). Web Push uses VAPID keys only — no extra paid push vendor.
