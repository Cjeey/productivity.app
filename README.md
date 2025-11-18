# FocusFlow (MVP)

A lightweight productivity dashboard built with **Next.js (App Router)**, **TailwindCSS**, **Zustand**, and **Supabase (client ready)**. It implements the MVP from the PRD: dashboard, tasks, deadlines, timetable, focus timer, and basic settings with local persistence.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 to use the app.

## Environment variables

Create `.env.local` (or copy `.env.local.example`) to connect Supabase if you want to sync data later:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The UI currently persists data locally with Zustand + `localStorage`. Supabase helpers are scaffolded in `src/lib/supabase-client.ts` so you can wire inserts/reads to your tables when keys are added.

## App structure

- `src/app/page.tsx`: Dashboard with greeting, today’s tasks, upcoming deadlines, timetable preview, quick Pomodoro, and weekly focus summary.
- `src/app/tasks`: Task CRUD + filters by category, priority, and status.
- `src/app/deadlines`: Deadline tracking with status + estimates.
- `src/app/timetable`: Weekly timetable planner.
- `src/app/focus`: Pomodoro timer + session history.
- `src/app/settings`: Name, timezone, focus target, and theme toggle.
- `src/lib/store.ts`: Zustand store with seeded data and `localStorage` persistence.
- `src/lib/seed-data.ts`: Initial data matching the PRD personas/modules.
- `src/lib/supabase-client.ts`: Supabase client + safe fetch/upsert stubs.

## Styling & tooling

- TailwindCSS (class-based tokens in `globals.css`).
- ESLint + TypeScript (`npm run lint`, `npm run typecheck`).

## Next steps

- Connect Supabase tables for tasks, deadlines, and sessions using `safeUpsert`/`safeFetch`.
- Add auth (email/password) and multi-device sync.
- Expand analytics (streaks, completion rates) and notifications. 
# productivity.app
