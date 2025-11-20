# FocusFlow

Personal productivity hub built with **Next.js (App Router)**, **TailwindCSS**, and **Supabase**.
All CRUD flows (tasks, deadlines, timetable, focus sessions, settings) now talk directly to Supabase with inline validation, toast feedback, skeleton loaders, and responsive layouts that mirror the design mocks.

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

Populate `.env.local` with the Supabase project keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## App structure

- `src/app/layout.tsx` – Shell with sidebar navigation, Sonner toaster, and theme handling.
- `src/app/page.tsx` – Dashboard overview.
- `src/app/tasks`, `src/app/deadlines`, `src/app/timetable`, `src/app/focus`, `src/app/settings` – Individual feature routes, each wired to Supabase with validation, skeletons, toasts, and delete confirmations.
- `src/app/error.tsx` / `src/app/not-found.tsx` – Friendly fallbacks for runtime errors and unknown routes.
- `src/utils/supabase/*` – Browser/server/middleware clients pre-configured for RLS.
- `src/components/ui/*` – Reusable UI primitives (badges, skeletons, timer, etc.).

## Testing

```bash
npm run test       # Vitest unit/integration tests
npm run test:watch # watch mode
npm run test:e2e   # Playwright smoke tests (requires `npx playwright install`)
```

Playwright uses `tests/e2e/smoke.spec.ts` and the config in `playwright.config.ts`. By default it hits `http://localhost:3000`.

## Tooling

- TailwindCSS for design system tokens and responsive utilities.
- ESLint + TypeScript: `npm run lint`, `npm run typecheck`.
- Sonner for global toast notifications.

# productivity.app
# productivity.app
