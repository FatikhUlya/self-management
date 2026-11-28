# Life OS

A personal operating system for running your own life from one place: daily planning, habits, goals, projects, finance, health, learning, journaling and periodic reviews. Built with Next.js 14, TypeScript, Tailwind and Supabase, with optional Gemini AI and Google Calendar integrations.

The UI is bilingual (Indonesian by default, English available in Settings).

## Modules

| Area | Routes | What it does |
|------|--------|--------------|
| Daily command | `/` | Morning check-in, active day view, evening review |
| Capture | `/capture` | Quick inbox for ideas and notes |
| Planning | `/planning`, `/planning/timeline` | Day plans and a timeline view |
| Goals | `/goals` | OKR-style goal hierarchy |
| Projects | `/projects`, `/projects/tasks` | Projects and their tasks |
| Habits | `/habits` (+ `calendar`, `analytics`, `manage`) | Habit tracking matrix, streaks, analytics |
| Focus | `/focus` | Focus sessions |
| Finance | `/finance` (+ `ledger`, `record`, `wealth`, `goals`) | Transactions, accounts, cash-flow chart, savings goals |
| Health | `/health` (+ `nutrition`, `workout`, `metrics`) | Meals and nutrition (with AI food scanning), workouts, body metrics |
| Learning | `/learning` (+ `paths`, `sessions`, `schedule`, `dictionary`) | Learning paths and modules, study sessions, Cornell notes, vocabulary |
| Journal | `/journal` (+ `write`, `entries`) | Rich-text journaling |
| Reviews | `/reviews` (+ `write`, `history`) | Weekly/monthly reviews with optional AI feedback |
| Mirror | `/mirror` (+ `new`, `goals`, `feedback`) | Self-awareness: trait self-evaluation and anonymous feedback from others via a shareable link (`/f/[token]`) |
| Rules | `/rules` | Personal rules and principles |
| Work | `/work/applications` | Job application tracker |
| Settings | `/settings` | Language, theme, connection status |

## Quick start

Requirements: Node.js 18+ and a Supabase project.

```bash
npm install
# create .env.local (see below)
npm run dev
```

Open http://localhost:3000 and sign in or register with email and password. Every page requires a signed-in user.

### Environment variables

Create `.env.local` in the project root:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Optional: AI review and food photo analysis (server-side only, never prefix with NEXT_PUBLIC_)
GEMINI_API_KEY=

# Optional: Google Calendar sync
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_API_KEY=
```

`.env*` files are git-ignored. Never commit real keys.

### Database

Run every file in [supabase/migrations/](supabase/migrations/) **in numeric order** (`001` → `027`) in the Supabase SQL Editor. Later migrations depend on earlier ones, and `023_security_hardening.sql` is required for row-level security on `users` and for the public feedback links to work. `024_life_journal.sql` (annual goals, wishlist) `025_life_records.sql` (notebooks, daily checks) `026_linked_records.sql` (links between them) and `027_opening_balances.sql` (account opening balances) back the Personal Life Journal features; without them those pages only save in local mode.

Step-by-step guides (in Indonesian):

- [docs/supabase-setup.md](docs/supabase-setup.md): creating the project, getting keys, verifying tables
- [docs/google-calendar-setup.md](docs/google-calendar-setup.md): OAuth client and API key for Calendar

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js config) |
| `npx tsc --noEmit` | Type-check |

## Project layout

```
src/
  app/                 Next.js App Router pages, one folder per module
    api/ai-review/     Gemini-powered review feedback (auth + rate limited)
    api/analyze-food/  Gemini food photo analysis (auth + rate limited)
    f/[token]/         Public anonymous feedback form
  components/          UI building blocks, layout (Sidebar, Topbar, MobileNav), auth
  lib/
    hooks/useLifeOSState.tsx   Central app state and all Supabase reads/writes
    supabase/                  Browser client and generated types
    server/auth.ts             JWT check and rate limiter for API routes
    gemini.ts                  Gemini client with model fallback and retries
    google-calendar.ts         Calendar integration
    i18n/                      Indonesian (id) and English (en) strings
    nutritionEngine.ts         Nutrition calculations
  providers/           App-wide React providers
supabase/migrations/   SQL schema, applied in order
docs/                  Setup guides
```

## Security notes

- Data is protected by Supabase row-level security: each user can only read and write their own rows. Keep RLS on in production.
- The anonymous feedback flow goes through `SECURITY DEFINER` RPC functions that require the exact token; there are no anonymous table policies.
- API routes that call Gemini require a valid Supabase session (`Authorization: Bearer <jwt>`) and are rate limited per user. The limiter is in-memory per instance, so it is best-effort on serverless hosts.
- Security headers (CSP `frame-ancestors`, HSTS, `nosniff`, Referrer/Permissions policy) are set in [next.config.mjs](next.config.mjs).
- Consider disabling public sign-ups in Supabase (Authentication → Providers) if the app is only for you.

## Deployment

The app deploys as a standard Next.js project (for example on Vercel). Set the same environment variables in the host's project settings and make sure all migrations have been run against the production database.

## Legacy and leftover files

These are not part of the running app:

- `index.html`, `app.js`, `styles.css`, `src/backend.js`: the original vanilla JS version, kept for reference
- `lifeos-next/`: an early `create-next-app` scaffold superseded by the root project
- `update_state.js`, `update_state.py`, `scratch/`: one-off maintenance scripts
- `.claude/skills/`: agent skills used for development with Claude Code
