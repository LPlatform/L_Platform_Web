# L Platform — Web Portal

One Next.js portal for **platform admins, organization admins and teachers** (students use the desktop app). Each role sees only its own area; every permission is enforced by the backend API and PostgreSQL row-level security — the web route guard is only for navigation.

## Public landing page

`/` is the public marketing page for students. **Download** opens an OS picker (Windows / macOS / Linux, pre-selected from the browser) and fetches `/api/downloads/latest/{platform}`, which the backend resolves from the desktop app's latest GitHub Release. No repository URL or token reaches the browser.

## What each role can do

| Role                   | Area                             | Main features                                                                                                                                           |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform owner / admin | `/admin`                         | Organizations, users, courses, allocations, reports, audit log, settings                                                                                |
| Organization admin     | `/admin` (own organization only) | Users, classes, sections, invitations, reports                                                                                                          |
| Teacher                | `/teacher`                       | Questions (**MCQ single/multi, short/long answer, coding** with test cases), assignments, assessments, reviewing and releasing grades, AI course reader |

## Run locally

```bash
pnpm install
pnpm dev   # http://localhost:3000 (backend must run on http://localhost:3001)
```

Env vars are read from the single workspace `.env` one folder up (`../.env`). See `.env.example`.

## Checks

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm e2e   # Playwright; needs the backend running with seeded data
```

## Deploy on Vercel

1. Import this repo in Vercel (framework: Next.js, defaults are fine).
2. Environment variables:
   - `BACKEND_URL` = your API URL (e.g. `https://lplatform-api.vercel.app`)
   - `NEXT_PUBLIC_API_URL` = _(empty)_ — the browser calls `/api/*` on this domain and Next.js proxies to `BACKEND_URL`, so login cookies are first-party.
   - `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false`
3. Add this web domain to the backend's `CORS_ORIGIN`.

Security headers (HSTS, frame-deny, nosniff, referrer and permissions policy) are set in `next.config.ts`.

## Design

Light-first professional theme (dark mode available): navy sidebar, green brand colour shared with the student app, flat cards, no gradients. Tokens live in `src/app/globals.css`.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query/Table, Zod, Vitest, Playwright.
