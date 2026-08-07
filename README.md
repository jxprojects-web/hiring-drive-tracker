# Walk-In Hiring Drive Candidate Tracker

A live, multi-role candidate tracker for a walk-in hiring event. Built with
React + TypeScript + Tailwind on the frontend, Supabase (Postgres + Auth +
Realtime) on the backend, and hosted free on Vercel. Runs entirely on free
tiers — no credit card required anywhere.

Stages: **Reception → HR Screening → Cabin 1–4 → LOI (offer) → Completed**,
with **Rejected** reachable from HR Screening or any Cabin. Cabin 4 is
reserved for experienced candidates only, enforced both in the UI and at the
database level.

---

## What you need to do by hand (everything else is already written)

Do these in order. Steps that require clicking around in someone else's UI
are called out explicitly — you don't need to have used Supabase, GitHub, or
Vercel before.

### 1. Create your free Supabase project

1. Go to **https://supabase.com**, click **Start your project**, sign in
   (GitHub sign-in is easiest).
2. Click **New project**. Pick any name (e.g. `hiring-drive`), set a database
   password (save it somewhere — you likely won't need it again), pick the
   region closest to your event, and choose the **Free** plan. Click
   **Create new project** and wait ~1–2 minutes for it to provision.
3. In the left sidebar, click the **SQL Editor** icon (looks like `>_`).
   Click **New query**.
4. Open `supabase/migrations/001_schema.sql` from this project, copy its
   entire contents, paste into the SQL editor, and click **Run** (bottom
   right). You should see "Success. No rows returned."
5. *(Optional — sample data for testing only, skip for a real event.)*
   New query again, paste the contents of `supabase/seed/002_seed_optional.sql`,
   click **Run**.
6. In the left sidebar, click **Project Settings** (gear icon) → **API**.
   Copy the **Project URL** and the **anon / public** key — you'll need both
   in Step 3.

### 2. Push this code to a free GitHub repo

Open a terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit: hiring drive tracker"
```

Then on **https://github.com**, click the **+** icon (top right) → **New
repository**. Name it (e.g. `hiring-drive-tracker`), leave it **Public** or
**Private** (either is free), do **not** initialize with a README, and click
**Create repository**. GitHub will show you commands — use these (replace
`YOUR-USERNAME`):

```bash
git remote add origin https://github.com/YOUR-USERNAME/hiring-drive-tracker.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel (free Hobby tier)

1. Go to **https://vercel.com**, sign in with your GitHub account.
2. Click **Add New… → Project**. Find `hiring-drive-tracker` in the list and
   click **Import**.
3. Vercel auto-detects Vite — leave the build settings as-is.
4. Before deploying, expand **Environment Variables** and add two:
   - `VITE_SUPABASE_URL` → paste the Project URL from Step 1.6
   - `VITE_SUPABASE_ANON_KEY` → paste the anon/public key from Step 1.6
5. Click **Deploy**. Wait ~1 minute. You'll get a live URL like
   `https://hiring-drive-tracker.vercel.app` — this is your app.

### 4. Create your first admin user

1. Back in Supabase, left sidebar → **Authentication** → **Users**.
2. Click **Add user** → **Create new user**. Enter your email and a
   password, and **check "Auto Confirm User"** (so you don't need to click
   an email link). Click **Create user**.
3. Go to the **Table Editor** (left sidebar) → open the `profiles` table.
   You should see a row for the user you just created, with `role` set to
   `reception` by default.
4. Click into that row's `role` cell and change it to `admin`. Save.
5. Go to your live Vercel URL and log in with that email/password — you'll
   land on the dashboard and see an **Admin** tab in the nav bar.

### 5. Add each role's login for staff, before the event

For every staff member (reception desk, HR, each cabin interviewer, LOI
desk):

1. In Supabase → **Authentication → Users → Add user**, same as Step 4.2,
   using that staff member's email and a password you give them. Check
   **Auto Confirm User**.
2. Log into the app once yourself as **admin**, open the **Admin** page, and
   in the **Staff Roster** table find their email and pick their role from
   the dropdown (`Reception`, `HR Screening`, `Cabin 1`…`Cabin 4`,
   `LOI Desk`). This takes effect immediately — no redeploy needed.
3. Give each staff member their email + password and the app URL. They log
   in and only see their own queue plus the shared dashboard.

For volunteers or anyone who just needs to watch the live queue with no
login, share `https://your-app.vercel.app/volunteer` — it's public and
read-only.

That's it — 5 steps, all click-through, no code changes needed to run a real
event.

---

## How it works

- **Realtime, not VBA:** every screen subscribes to Postgres changes on the
  `candidates` table via Supabase Realtime. When any staff member updates a
  candidate, every open dashboard/queue screen updates instantly — no
  refresh, no macros.
- **Audit trail:** a Postgres trigger (`log_candidate_stage_change`) writes
  an immutable row to `activity_log` on every insert and every stage change.
  No application code path can skip this — it fires at the database level.
- **Cabin 4 rule:** enforced by both a `CHECK` constraint
  (`cabin_4_requires_experience`) and a `BEFORE INSERT/UPDATE` trigger on
  `candidates`, plus the UI disables the option. Even a direct API call
  can't bypass it.
- **Row Level Security:** each stage-owning role (`reception`, `hr`,
  `cabin_1`…`cabin_4`, `loi_desk`) can only update candidates currently
  sitting at their own stage, and only move them to a legitimate next stage.
  `admin` has full access. Anonymous/read-only access is limited to `SELECT`
  on `candidates`, `activity_log`, and `settings` — used by the volunteer
  view.
- **Duplicate prevention:** `phone` has a `UNIQUE` constraint on
  `candidates`; the registration form shows a friendly error instead of a
  raw database error if it's violated.
- **Exports:** `.xlsx` and `.csv` are generated entirely in the browser
  using the `xlsx` (SheetJS) library — no server function, no paid backend.
- **Reset for next event:** the Admin page forces a fresh `.xlsx` export,
  then (only after typing `RESET` to confirm) calls a `SECURITY DEFINER`
  Postgres function (`reset_event_data()`) that clears `candidates` and
  `activity_log`. Admin-only, enforced both by the UI and inside the
  function itself.

## Local development (optional)

If you want to run it on your own machine before/after deploying:

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

## Project structure

```
supabase/migrations/001_schema.sql   Full schema, RLS, triggers — run once
supabase/seed/002_seed_optional.sql  Sample candidates (optional, delete before real use)
src/
  lib/supabase.ts        Supabase client
  lib/useRealtime.ts      Realtime hooks for candidates + settings
  lib/export.ts           xlsx/csv export
  lib/time.ts              Duration/formatting helpers
  contexts/AuthContext.tsx Session + role
  components/              Shared UI: badges, forms, per-stage action panels
  pages/                   Login, Dashboard, StageScreen, AdminScreen, VolunteerView
```

## Notes / things to double check before a real event

- Default alert thresholds are 15 minutes (HR wait) and 20 minutes
  (interview duration) — change them anytime on the Admin page.
- The seed data in `supabase/seed/002_seed_optional.sql` is for testing the
  flow only. Either skip running it, or from the Admin page do one **Reset
  for Next Event** before the real drive starts (it exports first, so
  nothing is lost).
- `candidate_code` is currently generated client-side from a timestamp
  (`WD-######`). If you'd prefer sequential badge numbers printed in
  advance, that's a small change to `ReceptionForm.tsx` — ask in a follow-up
  and it can be swapped for a DB sequence.
