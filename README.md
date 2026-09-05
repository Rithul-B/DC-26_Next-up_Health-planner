# Next Up

An **Inclusive by Design** app (DC 2026): one health step at a time.

Personal routines (meds, today’s visits, check-ins) stay on **Now** and **Today**. Shared, not-serious household health (dentist, flu shot, annual physical) lives in **Family Center** — no extra accounts.

The tone stays calm and simple, then gets quieter when a step is **Important** or **Critical**.

Data stays in this browser (`localStorage`). There is no login, no cloud sync, and this is not a medical device.

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

This repo is a normal Next.js app. Push `main` and work from there.

If you are still in a new project without a GitHub repository, create the repo from the project view, then clone or connect it as usual.

## Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js**. Build command `npm run build`. Output is handled by Next.
3. No environment variables are required.

Or from a machine with the Vercel CLI:

```bash
npx vercel
```

## Stack

Next.js, TypeScript, Tailwind CSS, shadcn/ui.
