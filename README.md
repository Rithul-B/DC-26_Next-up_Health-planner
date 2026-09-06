# Next Up

An **Inclusive by Design** app (DC 2026): one health step at a time.

Personal routines (meds, today’s visits, check-ins) stay on **Now** and **Today**. Shared, not-serious household health (dentist, flu shot, annual physical) lives in **Family Center**.

The tone stays calm and simple, then gets quieter when a step is **Important** or **Critical**.

This is not a medical device and not HIPAA-covered care.

## Households and sync

Any family can start their own house and add their own people. You are not locked to the You / Dad / Sam sample.

- **Start a household** — name the house, add yourself, optional password.
- **Join with a code** or a share link (`/join?code=XXXXXX`).
- **Helper** or **person** — same board. Helpers add steps and checkups.
- **Sample house** — code `NEXTUP` (You, Dad, Sam) so a first visit is not empty.
- **Stay on this device only** — starts with just you in this browser. It does not silently load Dad and Sam.

Cookie sessions keep you signed in. You can join with the house code (and the optional password). No Clerk or Auth0 required.

Due items show an in-app banner. On **Easier**, turn on **Remind me on this device** to allow browser notifications. There is no SMS or email unless you later add those services yourself.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

Local data uses **SQLite** (`prisma/dev.db`) by default. Copy `.env.example` to `.env` if you want to set values yourself. `npm run dev` creates the file database if it is missing.

If the database cannot start, the app stays up and shows **On this device only** (browser storage).

```bash
npm run build
npm start
```

## Vercel (live sync)

The site can stay on one device without secrets. **Phones will not share a house until Postgres is attached.**

We cannot set your Vercel environment from here. On [Vercel](https://vercel.com) for this project:

1. Open the project → **Storage** → create **Postgres** (or Neon) and attach it. That sets `DATABASE_URL`.
2. **Settings → Environment Variables** → add `SESSION_SECRET` (any long random string).
3. Leave the production URL as-is (for example `https://dc-26-next-up-health-planner.vercel.app`).
4. **Deployments → Redeploy** the latest production deployment.

Build already runs `prisma generate` and `prisma db push`. After those four steps, create or join a house on the live site and use the share link on another device.

Without `DATABASE_URL`, the live site still loads and keeps data in that browser.

## GitHub

This is a normal Next.js repo. Push `main`, then connect it from GitHub like any other app.

`.vercel` is gitignored so local CLI link files stay off the repo.

## Stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma (SQLite locally, Postgres when `DATABASE_URL` is a Postgres URL).
