# Next Up

An **Inclusive by Design** app (DC 2026): one health step at a time.

Personal routines (meds, today’s visits, check-ins) stay on **Now** and **Today**. Shared, not-serious household health (dentist, flu shot, annual physical) lives in **Family Center** — no extra accounts.

The tone stays calm and simple, then gets quieter when a step is **Important** or **Critical**.

Data stays in this browser (`localStorage`). There is no login, no cloud sync, and this is not a medical device. It is not HIPAA-covered care.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

```bash
npm run build
npm start
```

## What’s in the demo

Household on one device: **You**, **Dad**, **Sam**.

1. Open **Easier** and turn on **I’m helping** to add steps or checkups.
2. **Now** shows one next personal step. Critical items ask you to confirm.
3. **Family** is the shared checkup board.

## GitHub

This is a normal Next.js repo. Push `main`, then connect it from GitHub like any other app.

## Vercel

We cannot log into your Vercel account from here. To host it:

1. Import this GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js**. Build command `npm run build`. Output is handled by Next.
3. No environment variables are required.

Or from a machine signed into Vercel:

```bash
npx vercel
```

`.vercel` is gitignored so local CLI link files stay off the repo.

## Cursor / Code apps

Point a new Cloud Agent or Code app at this GitHub repo. No extra services or secrets are required.

## Stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui.
