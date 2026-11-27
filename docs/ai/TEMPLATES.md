# Templates

Skeletons for the files the AI creates during the scaffold and keeps afterwards. Copy the skeleton, replace everything in angle brackets, delete what doesn't apply to the tier. Keep the headings, so every project reads the same way.

Also in this kit, ready to use:
- `.claude/settings.json`: stops the AI's file tools reading or editing secret files. Change `project-secrets` to the project's secrets folder name.
- `.claude/hooks/block-secret-files.mjs`: stops shell commands that name a secret file. Same folder name to change.

## 1. `CLAUDE.md` (repository root)

Keep it under about 2,500 words. Rules every session needs stay here; detail goes to scoped `CLAUDE.md` files and `docs/`. Create `AGENTS.md` with one line, "Read `CLAUDE.md`.", for other agents.

```markdown
# <Project name>

<Two or three sentences: what it is, for whom, where it launches.>

Users are <who> on <devices>, on <connections>. <The one design consequence, for example "Fast, light and offline-tolerant beats clever.">

## Read first

| File | What it is |
|---|---|
| `docs/ai/AI-README.md` | How to work in this repository. Read it at the start of every session. |
| `docs/ai/CONTEXT.md` | Users, places, business rules, glossary, brand and voice. |
| `docs/ai/STANDARDS.md`, `docs/ai/DESIGN.md`, `docs/ai/SECURITY.md` | The bar for code, design and security. |
| `docs/spec.md` | Requirements (IDs such as CUS-01), data model, API, quality targets, plan. The source of truth for what to build. |
| `docs/decisions.md` | Decisions already made (D-nn). Don't reopen them without asking. |
| `docs/system.md` | How the running system works, with runbooks. Start here in an incident. |
| `docs/tasks/` | One task list per phase. |
| `docs/commands.md` | Every command, the layout, local settings, how the checks run. |
| `docs/owner-todos.md` | What only the owner can do. Check it before a task that needs an account. |
| `docs/ai-todos.md` | The AI's handoff between sessions, follow-ups, temporary things to remove, checks to run. |

**Scoped rules:** <folders with their own CLAUDE.md, for example `apps/web`, `apps/api`, `packages/db`>.

## Stack

- **Repository:** <single package or pnpm workspaces + Turborepo>. TypeScript strict. Node <LTS>, pinned in `.nvmrc` and `engines`.
- **Development:** on <the owner's OS>. Every command works there.
- **Web:** <framework, rendering mode, host>. <styling>, <forms>, <data fetching>.
- **API:** <framework, host>. <jobs>.
- **Database:** <PostgreSQL version, ORM, where it runs>. Local `<name>_dev`, tests `<name>_test`.
- **Files, email, SMS, payments:** <services, each behind an adapter with a local stand-in>.
- **Tests:** <Vitest against the test database; Playwright>.
- **Checks and deploys:** <pre-push hook and CI run `check`; who deploys what from which branch>.
- **Monitoring:** <error tracking, uptime, logs>.

## Environments and deploys

<Local URLs and ports; preview links; production hosts; production deploys from `production` only, a release is a merge of `main` into it. API changes are backward-compatible and live before the web changes that use them. Migrations add first and remove later.>

## Hard rules

- **Never touch the live database or server.** Tests use `<name>_test`; development uses `<name>_dev`; production changes only through migrations deployed by the pipeline. If a task seems to need live data, ask the owner.
- **Never read or edit `.env`-style files** or the secrets folder `<path>`. Check settings with value-free scripts.
- **Never deploy from a laptop.**
- **Money** in integer minor units with an ISO 4217 currency on every row; shown with `Intl.NumberFormat`. Never assume one currency.
- **Tenancy:** <every tenant-owned table has `<tenant>_id`; every query runs in a scope helper; row-level security is the second line; every new table gets a cross-tenant test.>
- **Permissions** checked in the API on every request. Hiding a button is not security.
- **Ledgers are append-only:** <which tables>. Mistakes are fixed with a reversing entry.
- **Only the API touches the database.**
- **Writes are idempotent:** every POST and PATCH accepts an `Idempotency-Key`.
- **Never log** secrets, tokens, codes, phone numbers, emails, names <or other project-specific data>.
- **Plan first** (and show the plan) for anything that touches the schema, sign-in, permissions, money, deleting data or deploys.
- **Ask, never guess.** If the spec is unclear or contradicts itself: ask. Never guess about money, permissions or deletion.
- **`docs/system.md`** is updated in the same commit as any change to what it describes.
- **Don't edit `docs/spec.md` or `docs/decisions.md` without asking;** propose the change.
- <Project-specific rules.>

## Data everywhere

- **IDs** are UUIDv7, made on the device or the server.
- **Time** is `timestamptz` in UTC, shown in <the user's or business's> time zone. Never hard-code a zone.
- **Phone numbers** are E.164, parsed with <the business's or user's> country.

## How to work

- Follow `docs/ai/AI-README.md`: one task at a time, plan first where required, the feature checklist, `check` green, docs updated, task ticked.
- Commits: `type(scope): summary (IDs)`, for example `feat(customers): household people (CUS-03)`. Types: feat, fix, docs, test, refactor, perf, chore, ci, build. <No "Co-authored-by" lines for the AI.>
- Before adding a dependency, say what it's for and why the stack won't do.

## Testing

- Integration tests run against `<name>_test`, which the tests reset themselves. Don't mock the database.
- Every route gets a permission test; every tenant-owned table a cross-tenant test.
- No hard-coded dates. Name flaky tests when reporting.

## Commands

| Command | Does |
|---|---|
| `<pm> dev` | <…> |
| `<pm> check` | lint + typecheck + test + e2e + size; must pass before a task is done |
| `<pm> test` | <…> |
| `<pm> db:migrate` / `db:generate` | <…> |

Every other command is in `docs/commands.md`.

## Don't

- <Tools and services ruled out in decisions.md, for example "Don't use Redis, GraphQL or tRPC".>
- Don't add CI workflows or new services without asking.
- Don't put business rules in components or route handlers.
- Don't hand-set colours or write raw hex values in components.
```

## 2. `docs/decisions.md`

```markdown
# Decisions

Settled choices, so they don't get argued again in every session. To change one, add a new entry that replaces it and note the replacement on the old entry; don't rewrite old entries. Dates are when the decision was made.

| # | Decision | Why | Revisit when |
|---|---|---|---|
| D-01 | **<Short bold title>.** <What was decided, with the alternatives rejected.> <Date>. | <The reason in one or two sentences.> | <The trigger, or —> |
```

When a decision is replaced, append to the old entry: `**Replaced by D-nn.**`

## 3. `docs/spec.md` (tier M and L)

```markdown
# <Project> specification

Status: <draft, approved on date>. Changes are proposed to the owner first.

## 1. Overview
<What, for whom, the problem, success measures. Points to docs/ai/CONTEXT.md.>

## 2. Users, roles and permissions
<Roles table: role, what they can do. Permission flags.>

## 3. Requirements
### <Area, for example Customers (CUS)>
- **CUS-01** <A requirement as one testable sentence.> *Acceptance:* <how we know it works.>

## 4. Data model
<Tables, key columns, relationships, which are tenant-owned, which are ledgers, retention.>

## 5. API
<Conventions: auth, errors, idempotency, pagination. Then routes by area: method, path, permission, request and response schema names.>

## 6. Quality targets
<Budgets: page weight, response times, capacity target, uptime, supported devices and browsers, accessibility level.>

## 7. Privacy and security
<Personal data, lawful basis, consent, retention, deletion, what is never logged, the law that applies.>

## 8. Integrations
<Each outside service: what for, the adapter, the local stand-in, failure behaviour.>

## 9. Plan
<Phases, each with its goal and the requirement IDs it delivers.>

## 10. Out of scope
<What isn't being built, and why.>
```

## 4. `docs/tasks/phase-N.md`

```markdown
# Phase <N>: <goal in a few words>

**Window:** <dates or "none">. **Decisions:** <D-nn>. **Spec:** <requirement IDs>.

**The bar:** <what every task in this phase must meet beyond the standard bar, for example "cross-tenant tests on every new table; money in minor units">.

## A: <group>
- [ ] **P<N>-01** <Task in a few words> (<IDs>). *Done when:* <checks a person can verify>.
- [x] **P<N>-02** <Task>. *Done when:* <…>. — <date>: <one-line note of what was done, commit hash>.

## Phase gate
- [ ] <What proves the phase works for real: a real device, a pilot user, a release.>
```

## 5. `docs/system.md` (tier M and L)

```markdown
# How <Project> works

For the owner and any engineer in an incident. Updated in the same commit as the system.

## 1. The big picture
<A diagram (Mermaid) of browsers, CDN, API, database, storage, outside services. A request's path, step by step.>

## 2. Hosts, environments and deploys
<Each host and what runs there. Environments. How a deploy happens, from which branch. Rollback.>

## 3. Data
<Main tables in groups. Tenancy and row-level security. IDs, money and time. Ledgers. The deletion path. What devices keep.>

## 4. Sign-in and sessions
## 5. Permissions
## 6. Security, layer by layer
<Edge, headers, rate limits and quotas, uploads, secrets, dependencies: what each layer stops and where it lives in the code.>

## 7. Logs, audit and activity
## 8. Capacity and scaling
<Load test results with dates. Known limits. When to worry. Links to docs/scaling.md.>

## 9. Monitoring and incidents
<What is watched and who is alerted.>
### Runbook: the site or API is down
### Runbook: a deploy fails
### Runbook: the database is full
### Runbook: a key has leaked
### Runbook: an account is being attacked

## 10. Costs
| Service | For | Plan and price today | What makes the bill grow, and the cap or alert |
|---|---|---|---|

## 11. Backups and recovery
<What is backed up, when, where, how long, encrypted how. Restore tests with dates.>
### Runbook: restore production

## 12. Assets and licences
<Every font, icon, image and sound used, with its licence or "ours". The notices file.>

## 13. Where to look in the code
```

## 6. `docs/scaling.md` (tier L)

```markdown
# Scaling watch list

Things that are fine now but will hurt as usage grows. Add to it when you find one; tick it when it's done.

| # | What | Hurts at | Plan | Status |
|---|---|---|---|---|
| S-01 | <for example "the orders list counts every row on each load"> | <about 50,000 orders per business> | <a stored count updated by trigger> | Open |
```

## 7. `docs/owner-todos.md`

Keep it out of Git (add it to `.gitignore`) if it names accounts or people.

```markdown
# Owner to-dos

Things only the owner can do. The AI adds items with exact steps; the owner ticks them, and tells the AI.

## Needed now
- [ ] **<Action>** — why: <what it unblocks>. Steps: 1) <…> 2) <…>. Then tell the AI: "<phrase>".

## Later
- [ ] <…>

## Done
- [x] <…> (<date>)
```

## 8. `docs/ai-todos.md`

Committed to Git. The rules for it are in `AI-README.md`, section 9.

```markdown
# To-dos for the AI

## Owner's list
Write anything you want added, changed or fixed, in your own words, one per line. Start a line with ! if it's urgent. The AI marks each line with what it did.

- [ ] <for example "! the save button is hidden behind the keyboard on my phone">
- [ ] <for example "change 'Client' to 'Customer' everywhere"> → P3-07

---
Below: the AI's own items. Not approved work (that's in docs/tasks/), and not the owner's jobs (that's docs/owner-todos.md).

## Handoff
<Updated at the end of every session. Date. The task under way and where it stands; anything half done (branch, files); what to do first next session; anything surprising.>

## Follow-ups
Noticed while working; not in scope. Promoted to a task list by the owner, or dropped.

| ID | Added | What | Where | Why it matters | Size |
|---|---|---|---|---|---|
| AT-01 | <date> | <for example "the customer list has no empty state"> | <file or screen> | <…> | <S, M, L> |

## Temporary: remove later
| ID | What | Remove when | Where |
|---|---|---|---|
| AT-02 | <for example "the old `phone` column, kept for old clients"> | <after every phone runs the release of 2 Dec> | <migration, files> |

## To verify
| ID | Check | When |
|---|---|---|
| AT-03 | <for example "uploads work on the production bucket"> | <after the next deploy> |

## Waiting on the owner
- <Pointer to the owner-todos item and what it blocks.>

## Done
- AT-nn <what> — <date>, <commit>.
```

## 9. `docs/commands.md`

```markdown
# Commands, the repository and the checks

## The task lists
<Which phase is next, under way, done, waiting.>

## Layout
<The folder tree with one line per folder.>

## Local set-up
<Install steps on the owner's OS. Where settings live (outside the repository). Local databases. Local stand-ins for outside services.>

## Commands
| Command | Does |
|---|---|

## The checks
<What `check` runs, in order. What the pre-push hook and CI run. How to read a failure. Flaky tests: how to report them.>

## Environment variables
<Each variable: what it's for, where it's set in each environment, whether it's secret. Values never appear here.>
```

## 10. CI workflow (`.github/workflows/check.yml`)

Adapt the package manager and services. The workflow runs the same `check` as the pre-push hook.

```yaml
name: check
on:
  push:
    branches: [main, production]
  pull_request:
permissions:
  contents: read
concurrency:
  group: check-${{ github.ref }}
  cancel-in-progress: true
jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    services: # tier M and L: a throwaway test database
      postgres:
        image: postgres:<version>
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: <name>_test
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready" --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      TEST_DATABASE_URL: postgres://postgres:postgres@localhost:5432/<name>_test
    steps:
      - uses: actions/checkout@<pinned version>
      - uses: pnpm/action-setup@<pinned version>
      - uses: actions/setup-node@<pinned version>
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm secrets && pnpm audit:deps && pnpm licences
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm check
```

Pin actions to a version or commit, give the workflow the least permissions, and protect `main` and `production` so a red check blocks merging. The CI database is throwaway and never holds real data.

## 11. Package scripts and the pre-push hook

```json
{
  "scripts": {
    "dev": "<…>",
    "lint": "<eslint> && prettier --check . && knip",
    "typecheck": "<tsc --noEmit, or turbo run typecheck>",
    "test": "<vitest run, against the test database>",
    "test:e2e": "<playwright test>",
    "size": "node scripts/size.mjs",
    "check": "node scripts/check.mjs",
    "secrets": "node scripts/secrets.mjs",
    "audit:deps": "node scripts/audit-deps.mjs",
    "licences": "node scripts/licences.mjs",
    "format": "prettier --write ."
  },
  "simple-git-hooks": {
    "pre-push": "node scripts/secrets.mjs && node scripts/audit-deps.mjs && node scripts/licences.mjs && node scripts/check.mjs"
  }
}
```

`scripts/check.mjs` runs lint, typecheck, test, test:e2e and size one after another, stopping at the first failure, at lowered priority and with limited parallel workers so the owner's machine stays usable. Scripts are Node files so they run the same on Windows, macOS and Linux.

## 12. `.env.example`

```bash
# Every variable the project reads, with a comment. No real values, ever.
# Copy to the secrets folder outside the repository, not to .env in the repository.

# The API's public URL. Development: http://localhost:4000
API_URL=
# PostgreSQL for development. Secret.
DATABASE_URL=
# PostgreSQL for tests only; reset by the tests.
TEST_DATABASE_URL=
# Email driver: console (development only; refused in production) or resend. 
EMAIL_DRIVER=console
```
