# Scaffold: deciding what to build and setting it up

Use this file in the first session of a new project, or when adopting an existing one (section 9). It turns the owner's idea into decisions, a filled-in `CONTEXT.md`, a first set of project docs and a working, checked, deployable skeleton.

**The order never changes:** interview → summary → the owner's yes → build phase 1. Nothing is installed, created or bought before the yes.

## 1. How to run the interview

- **Rounds:** ask one round at a time, at most four questions per round. Use the multiple-choice question tool when there is one, otherwise a numbered list.
- **Options:** two to four per question, your recommendation first, labelled "(recommended)", with one line on why. The owner can always answer in their own words.
- **Skip what's settled:** if an earlier answer or the owner's first message already settles a question, don't ask it; state what you took from it.
- **Infer, then confirm:** where you can make a sensible default, put it in the summary as an assumption rather than asking.
- **Write as you go:** after each round, write the answers into `docs/ai/CONTEXT.md` and keep a draft decisions list.
- **Check the present:** before recommending a tool, check its current stable version, pricing and whether it's still maintained. Your memory is out of date.
- **Stop early when it's simple:** a three-page website needs rounds 1, 3 and a short round 4, not all six.

## 2. The tiers

Round 1 decides the tier. The tier decides which rounds you run and which parts of `STANDARDS.md` and `DESIGN.md` apply.

| Tier | What it is | Examples | Typical shape |
|---|---|---|---|
| **S** | Content and pages, no user accounts, little or no stored data | Brochure site, portfolio, landing page, blog, docs site, event page | Static site, a form handler, a CMS at most |
| **M** | Accounts or stored data, one organisation's data, modest scale | Internal tool, booking site for one business, small store, admin dashboard, simple app | Web app + one API or backend-as-a-service + one database |
| **L** | Many organisations' data (multi-tenant), money, roles, offline, integrations, growth | SaaS, marketplace, operations app like OrdaBook | Monorepo: web app, API, jobs, one database with tenant isolation |

When in doubt between two tiers, pick the lower one and record in `docs/decisions.md` what would move it up.

## 3. Round 1: what is it? (every tier)

1. **What are we building?** Ask the owner for a few lines in their own words if they haven't given them. Then confirm the kind:
   - Website: pages and content (S)
   - Online store (S with a hosted shop, M if custom)
   - Web app for one business or team (M)
   - Software many businesses sign up to, each with their own data (L)
2. **Who uses it, on what, and where?** Who the users are; their devices (low-end Android, iPhone, office desktops); their connection (patchy mobile data, office Wi-Fi); their countries and languages. This decides the architecture more than anything else, so get it concrete.
3. **What does success look like at launch and in 12 months?** Users, businesses or visitors; the one thing it must do well.
4. **What's the budget and timeline?** Monthly running cost the owner accepts at launch; any deadline; who works on it (the owner alone with AI, or others too).

→ State the tier and why in one line.

## 4. Round 2: the product's shape (M and L)

1. **Accounts:** who signs in (owners, staff, customers, admins), and how (email one-time code, password, Google or Apple, phone and SMS code, magic link). Recommend the cheapest method that works where the users are.
2. **Roles and permissions:** which roles exist and what each may do. Draft a role table in `CONTEXT.md` and confirm it.
3. **Money:** none; record payments made elsewhere; take payments online (which provider works in the owner's country); subscriptions; payouts to others. Which currencies.
4. **Data and files:** what is stored; photos or documents uploaded; anything sensitive (health, children, identity, finance); which data protection law applies.

Then, if they apply:

5. **Offline:** must it work with no connection (record now, sync later)? This is expensive to add later, so decide now.
6. **Messages:** email, SMS, WhatsApp, push notifications; transactional only or marketing too.
7. **Real-time:** do screens need to update when someone else changes something?
8. **Integrations:** payments, accounting, maps, calendars, AI features, others.
9. **Admin:** does the owner need a back office (support, switching features on, refunds)?
10. **Languages:** one or several; right-to-left scripts.

## 5. Round 3: brand and content (every tier)

1. **Brand:** existing name, logo, colours and fonts, or create them? Any brand guide to follow?
2. **Personality:** three words for how it should feel (for example "calm, trustworthy, local"); sites or apps the owner likes, and ones they dislike, with why.
3. **Voice:** formal or friendly; words customers use; words to avoid (for example "custom-order", never "made-to-order").
4. **Content and reach (sites):** who writes and edits the content and how often (decides whether a CMS is needed); how much search traffic matters; analytics wanted, and with or without cookies; legal pages needed (privacy, terms, cookies, refunds).

Record all of it in `CONTEXT.md` (brand, voice, glossary). `DESIGN.md` explains how it's used.

## 6. Round 4: the stack

Present the stack as one table: each layer, your recommendation, one alternative, and why. Ask only about layers where the owner has a preference or the choice is close. Every choice becomes a decision (D-nn) with why, the alternatives rejected, and when to revisit it.

**Principles for choosing:**
- Boring, proven, well-documented tools that AI agents know well. One language across the stack where possible (TypeScript, strict).
- Every extra service (a cache, a queue, a second database, a search engine) is something more to run, secure, back up and pay for. Add one only when a measured need appears.
- Prefer tools with no lock-in at the data layer: the data should be easy to move.
- Free and cheap tiers are fine at launch; know the price at the next step up, and put it in `docs/system.md` (costs).
- Fit the owner's machine: on Windows, prefer tools with prebuilt Windows binaries and no Docker requirement.

### The defaults (check each is still current)

| Layer | S: website | M: app for one business | L: multi-tenant app |
|---|---|---|---|
| Language | TypeScript, or plain HTML and CSS for a few pages | TypeScript (strict) | TypeScript (strict) everywhere |
| Frontend | Astro (static output) | Next.js as a static export, or Vite + React | Next.js static export or Vite + React, as a PWA if offline matters |
| Styling | Tailwind CSS with a theme file | Tailwind CSS with a theme file | Tailwind CSS with a theme file, plus a shared UI package |
| Components | Hand-built | Headless primitives (Radix or React Aria), styled to the brand | Headless primitives in a shared UI package |
| Forms | Native form + server-side validation | react-hook-form + zod | react-hook-form + zod, schemas shared with the API |
| Data fetching | None | TanStack Query | TanStack Query, its cache persisted if offline |
| Backend | None, or one serverless function for forms | One API (Fastify or Hono), or a backend-as-a-service (Supabase) if speed beats control | One API (Fastify or Hono) as a modular monolith |
| Database | None, or the CMS's | PostgreSQL (managed) | PostgreSQL, with row-level security for tenants |
| ORM / queries | None | Drizzle (close to SQL), or Prisma if the owner knows it | Drizzle |
| Migrations | None | The ORM's migrator, run by the pipeline | Same, add-first then remove-later |
| Auth | None | A library with sessions in your database, or the backend-as-a-service's auth | Sessions in your own database (httpOnly cookies), sign-in method from round 2 |
| Background jobs | None | Database-backed queue if needed (pg-boss) | pg-boss in Postgres; no Redis until measured |
| Files | In the repository | S3-compatible storage (Cloudflare R2) with signed URLs | Same, private buckets, signed upload and download links |
| Email | Form service or Resend | Resend, Postmark or SES | Same, with SPF, DKIM and DMARC |
| Payments | A hosted checkout link | The provider that works in the owner's country (Stripe, Paystack, Flutterwave…) | Same, behind an adapter, webhooks verified and idempotent |
| CMS (if content changes often) | A git-based or hosted headless CMS | — | — |
| Hosting: web | Cloudflare Pages or Workers static assets, Netlify, or Vercel | Same | Same |
| Hosting: API and database | — | A platform (Render, Fly.io, Railway) plus managed Postgres (Neon, Supabase or the platform's) | A platform, or a VPS once the owner can run it (with backups and a runbook) |
| Repository | One package | One package, or web + api folders | pnpm workspaces + Turborepo: `apps/web`, `apps/api`, `packages/*` |
| Unit and integration tests | Vitest for any logic | Vitest, against a real test database | Same |
| End-to-end tests | Playwright smoke test of key pages | Playwright for the main journeys | Playwright, plus offline tests if offline |
| CI | GitHub Actions running `check` | GitHub Actions + a pre-push hook, both running `check` | Same, with branch protection on `main` and `production` |
| Errors and uptime | An uptime check | Sentry (or similar) + uptime checks | Same, plus alerts to the owner's phone |
| Logs | Host's logs | Structured logs (pino) with redaction | Same, with request IDs |
| Analytics | Cookie-free (Cloudflare Web Analytics, Plausible) | Same | Same, product analytics without personal data |
| Money, dates, phones | `Intl` | `Intl`; `libphonenumber-js` for phones | Same |
| Languages | Astro i18n routing if needed | An i18n library with message files | Same, no strings in code |

### Things to decide explicitly (they're costly to change)

- **Where the data lives** (region), given the users and the law.
- **Static frontend or server-rendered:** static (served from a CDN, no server at page load) is cheaper and has less to attack; choose server rendering only for a real need (per-request SEO on dynamic data, for example).
- **Tenancy model (L):** one database with a tenant column and row-level security (default), or a database per tenant (rarely worth it).
- **IDs:** UUIDv7 made on the client or server (default for M and L) rather than auto-increment.
- **Offline (L):** decided in round 2; if yes, it shapes IDs, idempotency and the cache.
- **Money:** integer minor units with a currency on every row (default whenever money is stored).

## 7. Round 5: how we work (every tier, short)

1. **The owner's machine:** Windows, macOS or Linux. Every command must work there.
2. **Git host and branches:** GitHub (default), `main` always deployable, `production` for releases (M and L); preview links per branch if the host offers them.
3. **Environments:** local, preview and production (default); a hosted staging only if the budget allows and a real need exists.
4. **The gate:** `check` runs on pre-push and in CI (default). For S, CI alone is enough.
5. **What needs the owner's yes** beyond the default list in `AI-README.md` (section 4, step 2).
6. **Accounts:** which accounts the owner already has (domain registrar, DNS, GitHub, hosting, email); all are in the owner's name, with two-factor on.

## 8. The summary, then phase 1

### The summary (one message or one proposal file)

1. What it is, the tier, and why.
2. The users, devices and places, in two lines.
3. The stack table, with costs at launch and at the next step up.
4. The repository layout (below).
5. Assumptions you made without asking.
6. What the owner must set up (accounts, domains, keys), in order.
7. Phase 1's task list.

Wait for the owner's yes. Then write `docs/decisions.md` (D-01 onwards), `CLAUDE.md` and `AGENTS.md` from `TEMPLATES.md`, the first `docs/spec.md` (M and L), `docs/tasks/phase-1.md`, `docs/commands.md`, `docs/owner-todos.md` and `docs/ai-todos.md`, and commit them before any code: `docs(repo): decisions, context and plan from the scaffold (P1-11)`.

### Repository layouts

Tier S:
```text
src/            pages, layouts, components, content
public/         images, fonts, icons, robots.txt
docs/           ai/, decisions.md, tasks/, commands.md
scripts/        check and other repository scripts (Node, so they run on any OS)
```

Tier M:
```text
src/
  app/ or pages/    routes and screens
  components/       UI, styled from the theme
  domain/           business rules, pure functions, no framework imports
  server/ or api/   handlers (thin), services, repositories (the only code touching the database)
  lib/              shared helpers: money, dates, phones, validation schemas
db/                 schema and migrations
tests/              integration and end-to-end
docs/ scripts/
```

Tier L:
```text
apps/
  web/            the web app (and website) as a static build
  api/            the HTTP API; runs the jobs at first
packages/
  contracts/      zod schemas and types shared by web and api
  domain/         pure business rules
  db/             schema, migrations, repositories, scope helpers, seed
  integrations/   storage, email, SMS, payments, each behind an adapter with a local stand-in
  ui/             the design system
  config/         tsconfig, lint, format, env validation
docs/ scripts/ infra/
```

The flow in M and L: **contracts → domain → repositories → thin routes**. Routes validate, check permissions, call a service, return. Business rules live in `domain`. Only the API (or server folder) touches the database.

### Phase 1 tasks (adapt to the tier; S skips those marked M or L)

- **P1-01 Repository:** `.gitignore`, `.editorconfig`, the runtime version pinned (`.nvmrc` and `engines`), the package manager pinned, lockfile committed, `README.md`.
- **P1-02 Code quality:** TypeScript strict, ESLint, Prettier, dead-code check (knip), consistent import paths.
- **P1-03 Layout:** the folders above, with one example of each layer wired end to end.
- **P1-04 Settings and secrets:** `.env.example` with every variable; settings validated at start-up (refuse to start on a missing or dangerous value, such as a development email driver in production); secrets in a folder outside the repository; the AI's deny rules and secret-file hook (`TEMPLATES.md`).
- **P1-05 The check:** one `check` script (lint, typecheck, tests, end-to-end, size budget) run by a pre-push hook and by CI; the secret scan, dependency audit and licence check before every push.
- **P1-06 Database (M, L):** local development and test databases, migrations, seed data, the scope helper and row-level security (L), and the first cross-tenant test.
- **P1-07 API (M, L):** health endpoint that checks the database; one error format; request IDs; log redaction; timeouts on outgoing calls; rate limits; idempotency on writes; CORS for the web app's origin only; security headers; permission checks with a test.
- **P1-08 Web:** the theme from `CONTEXT.md` (tokens only, no raw colours in components); base layout; loading, empty, error and not-found states; Content-Security-Policy; the size budget; the website basics from `DESIGN.md` (S).
- **P1-09 Deploys:** preview and production deploys from Git only; domain, HTTPS and HSTS; migrations run by the pipeline (M, L).
- **P1-10 Operations (M, L):** error tracking, uptime checks with alerts, daily backups stored elsewhere and one restore tested, the first `docs/system.md` with a "the site is down" runbook.
- **P1-11 Docs:** `docs/commands.md` true, `docs/owner-todos.md` with the owner's steps, `docs/ai-todos.md` with the handoff and anything deferred.

**Phase 1 is done when:** a fresh clone installs and passes `check` on the owner's machine; a push to `production` deploys a hello-world through the pipeline; the health check is green; and (M, L) a backup has been restored once.

## 9. Adopting an existing project

When the code exists but the kit is new:

1. **Read before asking.** Read the code, `package.json`, config, existing docs and the last 50 commits. Work out the tier, the stack and the conventions already in use.
2. **Map the existing files; don't duplicate them.** The project may already have a to-do list, a decisions file, a spec, a `CLAUDE.md`, `AGENTS.md` or other agent rules, a changelog or notes. For each role in `AI-README.md` section 1, find the file that already plays it and keep using it (with its own name and format), or say which kit file will be created because none exists. Write the result as a "Where things live" table at the top of `CLAUDE.md`, and propose it to the owner before moving or renaming anything.
   - **Never overwrite** an existing `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, to-do list or docs file. Merge: add the kit's rules and deny entries alongside what's there, and point out any rule that conflicts.
   - **An existing to-do list** keeps its place and format; add an "Owner's list" section to it, or use `docs/ai-todos.md` and link the two, whichever the owner prefers.
   - **Rules from the old files that the kit lacks** stay, and are listed for the owner in case they belong in the master kit too.
3. **Fill in what you can.** Draft `CONTEXT.md` and `docs/decisions.md` from what's there, marking each inferred line "(inferred, confirm)".
4. **Ask only the gaps.** Run the rounds above only for what the code can't tell you (users, places, brand, budget, the owner's machine).
5. **Measure against the bar.** Compare the project with `STANDARDS.md`, `DESIGN.md` and `SECURITY.md`. Write the gaps to `docs/audit-YYYY-MM.md` as findings (AUD-nn), each with severity (critical, high, medium, low), evidence (file and line), the fix and its cost.
6. **Propose the order.** Critical security and data-loss risks first, then the check and CI, then backups and monitoring, then the rest. Put it in a task list and wait for the owner's yes.
7. **Respect what exists.** Keep the project's existing conventions unless they break a hard rule; changing them is a decision to propose, not a side effect.
