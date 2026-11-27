# Engineering standards

The bar every change is held to. Each rule is tagged with the tiers it applies to:

- **[All]** every project, including a simple website
- **[M]** apps with accounts or stored data (tier M and L)
- **[L]** multi-tenant, money, offline or high-growth apps (tier L only)

The tier is set in `CONTEXT.md`. When a rule doesn't apply, skip it; when you're unsure, ask. When a rule conflicts with a decision in `docs/decisions.md`, the decision wins, and you mention the conflict.

Most rules here come from real incidents. Where a rule has a short story in brackets, it's what happened without it.

## 1. Before any code

- **[All] Who, on what, where.** `CONTEXT.md` names the users' devices, connection and places. Design for those, not for a fast laptop on good Wi-Fi, which is what AI assumes by default. (Low-end Android on patchy data decided OrdaBook's whole architecture: offline-first, a static web app, size budgets.)
- **[All] A decision log from day one** (`docs/decisions.md`): the decision, why, the alternatives rejected, and when to revisit. Without one, each AI session reopens settled questions and slowly undoes them.
- **[M] One source of truth for requirements** (`docs/spec.md`), each with an ID, so commits and comments can say why code exists.
- **[All] Written hard rules** in `CLAUDE.md`, stated as rules ("money is integers"), not hopes. AI follows explicit rules well and implicit ones badly.
- **[All] Boring, proven technology,** with the reason recorded. Each extra service is another thing to run, secure, back up and pay for.

## 2. Architecture

- **[M] Layers:** contracts (shared schemas and types) → domain (pure business rules) → repositories (the only code touching the database) → thin routes (validate, check permission, call a service, respond). No business rules in UI components or route handlers.
- **[M] One deployable backend** (a modular monolith) until a measured need splits it. Modules talk through functions, not HTTP.
- **[M] Only the backend touches the database.** The browser goes through the API with a typed client generated from or sharing the contracts.
- **[All] Static frontend where possible:** nothing runs on a server at page load, so there's less to attack, less to pay for and less to break. Server rendering only for a recorded need.
- **[M] Adapters for every outside service** (storage, email, SMS, payments), each with a local stand-in (memory storage, console email, a fake payment provider), so development and tests need no accounts and providers can be swapped.
- **[M] Feature flags and dormant features:** ship code switched off, switch it on later (by setting, by plan, by admin). A flag has an owner and a date to remove it.
- **[L] Data-driven variation:** when customers differ (trades, forms, plans), describe the difference in data (presets, templates, settings), not in a code path per customer type.
- **[L] One change channel:** screens learn about changes from one stream (database triggers → server-sent events or similar), not from each screen polling.
- **[All] Small files:** under about 800 lines; past about 1,000, split by responsibility before adding more. Big files get risky for AI to change.

## 3. Data

The hardest things to fix later.

- **[M] Money** in integer minor units of its currency (`bigint` in Postgres, integers in code), never floats, with an ISO 4217 currency on every row that holds money. Shown with `Intl.NumberFormat(locale, { style: 'currency', currency })`. Never assume one currency.
- **[M] Time** stored as `timestamptz` in UTC, shown in the user's or business's IANA time zone. Never hard-code a zone. Dates without time (a due date) are stored as dates, not midnight timestamps.
- **[M] IDs** are UUIDv7, made on the client or the server, so records made offline or retried keep their IDs. No auto-increment IDs in URLs or APIs. Human-friendly numbers (order 0042) are a separate field.
- **[M] Phone numbers** stored in E.164, parsed with the user's or business's country.
- **[L] Tenancy from the first table:** a tenant ID on every tenant-owned row; repository functions take the tenant ID first; every query runs in a scope helper that sets the row-level-security scope for one transaction; Postgres row-level security as the second guard; a cross-tenant test for every table. (AI writes `SELECT * FROM orders WHERE id = $1` and forgets the tenant every time.)
- **[M] Ledgers are append-only:** payments, approvals, pay lines and audit logs are never updated or deleted; mistakes get a reversing entry.
- **[M] The database enforces what it can:** `NOT NULL`, foreign keys, `CHECK` constraints, unique indexes. Validation in code is the first line, not the only one.
- **[M] Migrations add first, remove later** (expand, then contract): add a column, deploy code that uses it, remove the old one in a later release, so old and new code both work during a deploy. Never edit a migration that has run anywhere.
- **[M] Deletion and privacy planned at the start:** what "delete my account" removes, what the law makes you keep and for how long, how personal data is cleared from logs, backups and caches. One deletion path, used by everything. (OrdaBook needed a whole phase for this later.)
- **[M] Data saved on a device outlives every schema change:** readers check what they get and fail quietly (show a fallback, never crash). (A formatter that threw on an old cached shape caused a crash loop.)
- **[M] Indexes for the queries you actually run,** checked with `EXPLAIN` on realistic data. No whole-table scans on hot screens.
- **[M] Created and updated timestamps** on every table; who changed money or permissions recorded in an activity log (who, when, before, after).
- **[M] Seed data** for development that looks real but is invented; never production data on a laptop.

## 4. API and backend

- **[M] Validate every input** against a shared schema (zod) at the edge. Nothing unvalidated reaches business logic. Responses are typed too.
- **[M] One error shape** (code, message for people, details for forms), and no stack traces or internals in responses.
- **[M] Idempotent writes:** every POST and PATCH accepts an `Idempotency-Key`, stored with the result for a set time. Phones retry, users double-tap and queues replay; without it you record payments twice.
- **[M] Timeouts on every network call** (database, storage, email, payments, anything outside the process). (A slow storage call hung the whole API while its health check stayed green.)
- **[M] Never hold a database transaction open while waiting on another service.** Fetch, then open a short transaction.
- **[M] Size the connection pool and give it a wait timeout;** return a clear "busy, retry after" (503 with `Retry-After`) rather than freezing. (A dozen parallel requests froze an API until someone restarted it by hand.)
- **[M] Pagination** by cursor for lists that grow; a maximum page size.
- **[M] Backward compatibility:** API changes are additive and go live before the web changes that use them. Old clients keep working until they're gone; removing a field is a two-release change.
- **[M] Jobs** in a database-backed queue, with retries, backoff, a dead-letter state and idempotent handlers. Send emails and webhooks through an outbox written in the same transaction as the change.
- **[M] Webhooks in:** verify the signature, store the event ID, process idempotently, answer fast and do the work in a job.
- **[M] Health endpoints that check something real:** the process is up (liveness); the database answers and the jobs run (readiness).
- **[M] Settings validated at start-up:** refuse to start on a missing value or a development-only setting in production (a console email driver, a memory storage driver).

## 5. Security baseline

`SECURITY.md` is the full guide. These are the minimum, the things AI coding most often misses.

- **[M] Permissions checked on the server for every request,** with a test per route that the wrong role is refused. A hidden button is not security.
- **[All] Validate every input** (section 4); escape output; no `dangerouslySetInnerHTML` or raw HTML from users.
- **[M] Uploads are hostile:** fix the exact size and type into the signed upload link, make links expire quickly and write-once, check the real bytes, and re-encode images on the server. (Without it, anyone could upload 5 GB or replace a shop's public photos.)
- **[M] Reset, invite and magic links are as powerful as a password:** single use, short-lived, bound to one account, stored hashed. (A reset link once signed its sender in as the other person.)
- **[All] Rate-limit everything costly or public,** counted somewhere shared (the database), not in process memory. Group IPv6 addresses by /64. Trust a client-IP header only when it provably came from your own proxy.
- **[M] Per-tenant quotas and cost ceilings** from the start (rows, storage, emails, SMS per day). (One free account could fill the whole database; invite emails used up the daily email allowance and sign-in codes stopped for everyone.)
- **[All] Never log secrets or personal data:** configure the logger to redact them; the same rule for the browser console and error tracking. (Tracking tokens were logged in full.)
- **[M] Sessions:** random tokens stored hashed; cookies `HttpOnly`, `Secure`, `SameSite`, scoped to the API's host only; expiry and sign-out everywhere. Sign-in never reveals whether an account exists. Changing a password, email or two-factor needs a recent re-sign-in.
- **[All] Security headers:** a Content-Security-Policy with no `unsafe-inline` scripts (easy at the start, very hard later), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`. CORS allows only your own origins.
- **[All] No secrets in the frontend bundle;** only variables meant to be public get the public prefix.
- **[All] What the network tab shows:** responses carry only the fields the screen needs (no hashes, internal IDs of other tenants, staff notes or other users' data "just in case"); no tokens, codes or personal data in URLs or query strings (they end up in logs and history); no server or framework fingerprints in headers (`X-Powered-By`, version numbers in `Server`); no personal data or internal details in response headers or error bodies; source maps not served publicly in production.
- **[All] Supply chain:** dependency audit, licence check and secret scan before every push; pin the runtime; be wary of packages published days ago.
- **[All] Accounts:** two-factor on every account the project depends on (GitHub, hosting, DNS, domain registrar, email). Losing the domain or the email account loses everything.

## 6. Frontend engineering

`DESIGN.md` covers how it looks and reads; this covers how it's built.

- **[All] Budgets enforced by the build:** for example, an app shell of at most 200 KB of JavaScript (compressed) and 60 KB more per screen; a website page under 100 KB of JavaScript. A size script fails the check when a budget is broken. AI adds a dependency for every small problem; the budget stops it.
- **[All] Images** in modern formats, sized for their slot, lazy below the fold, with width and height set.
- **[M] Data fetching** through one client and one cache (TanStack Query); no fetching in effects by hand; errors and loading handled in one place.
- **[M] Error boundaries** around each screen, so one broken widget doesn't blank the app; the error reaches error tracking.
- **[L] Offline (if chosen):** a service worker with a clear update strategy; the query cache persisted; writes queued with idempotency keys and replayed; conflicts resolved by a rule written in the spec; the UI shows what's waiting to sync.
- **[M] Forms** with react-hook-form and the same zod schema as the API; the submit button guards against double submission.
- **[All] No strings in components when there's more than one language;** messages live in files per language.
- **[M] Cached data is versioned;** a new release can read the old cache or clears it safely.

## 7. Performance and capacity

- **[All] Measure on the users' devices:** test pages on a mid-range or low-end phone profile with a slow network (4G throttled) before calling them done.
- **[M] Load-test once** before launch, so you know the numbers ("about 170 phones in a busy hour", not "it'll be fine"), and again after big changes. Record the result in `docs/system.md`.
- **[M] Watch for N+1 queries** and slow queries (log any over a threshold); add indexes for real queries.
- **[M] One request per screen where possible:** a screen's data in one call, not a waterfall.
- **[L] A scaling watch list** (`docs/scaling.md`): things fine now that won't be later, with the trigger ("at 500 businesses") and the plan.
- **[L] Know the overload behaviour:** what happens at ten times the load (queue, shed with 503, slow down), and that the client retries politely.

## 8. Testing

- **[All] Tests come with every change.** A bug fix starts with a test that fails.
- **[M] Test against a real database,** not mocks: most tenancy and transaction bugs live where mocks can't see. Tests reset their own test database; they never touch the development or production one.
- **[M] Every route gets a permission test; [L] every table a cross-tenant test.** These are the tests that prevent breaches.
- **[M] Business rules (domain) have unit tests** for every rule and edge case, money and dates above all (rounding, zero, negative, currency with no minor unit, time-zone edges, month ends).
- **[All] End-to-end tests** (Playwright) for the journeys that matter most: sign-up, the core task, payment. Tier S: a smoke test that every page loads and the form submits.
- **[All] No hard-coded dates in tests:** use "today plus 30 days" or a fake clock. (A test with 2026-11-20 failed once that date passed.)
- **[All] Name flaky tests and fix them.** A test that passes only on retry teaches everyone to ignore red. Report it by name; never mark it skipped to get green.
- **[M] Accessibility checks** (axe) in the end-to-end tests of main screens.
- **[All] Test on the OS family you deploy to,** or at least build there: Windows ignores the case of file names and Linux doesn't.

## 9. Git, CI and releases

- **[All] One `check` script** is the single definition of "green": lint (with format and dead-code checks), typecheck, tests, end-to-end, size budgets. Locally, the pre-push hook runs it; in CI, the same script runs. Keep it light enough that the owner's machine stays usable (limit parallel workers).
- **[All] An automatic gate that can't be skipped:** CI on every push and pull request, and branch protection on `main` and `production` requiring it. A local hook alone depends on one PC and one tired person.
- **[All] Before every push:** secret scan, dependency audit, licence check (fail on licences the project can't use).
- **[All] Releases:** `main` is always deployable; production deploys only from `production` (or tags), by the host or CI; a release is a merge of `main` into `production`. Never deploy from a laptop.
- **[M] Migrations run by the pipeline** before the new code starts; a failed migration stops the deploy.
- **[M] Rollback:** know how to go back (redeploy the previous build; migrations are additive so old code still runs). Write it in `docs/system.md`.
- **[M] Deploy order:** API changes are live before the web changes that use them (section 4).
- **[All] Preview deploys** per branch for the signed-out pages, when the host offers them.
- **[All] Pins:** runtime version in `.nvmrc` and `engines`; package manager in `packageManager`; lockfile committed; install scripts allowed only for packages that need them.
- **[All] Dependency updates** on a schedule (a bot or a monthly task), read before merging, never auto-merged for major versions.

## 10. Hosting and environments

- **[All] Environments:** local, preview and production. A hosted staging only when the budget and a real need justify it.
- **[All] Secrets** live in the host's settings and the owner's folder outside the repository; `.env.example` lists every variable with a comment; nothing secret is committed.
- **[All] Domain and DNS:** domain on auto-renew with the registrar's lock on; HTTPS everywhere; HSTS once stable; DNS changes recorded in `docs/system.md`.
- **[M] Email DNS:** SPF, DKIM and DMARC for any domain that sends mail; a separate subdomain for app mail (`mail.example.com`).
- **[M] Region** near the users and within the law's limits; the API near the database.
- **[M] Costs** in `docs/system.md`: each service, today's price, the next step up and what triggers it.
- **[L] Self-hosting (a VPS)** only with: firewall, SSH keys only, automatic security updates, a process manager (systemd), backups with restore tests, monitoring and a written rebuild runbook.

## 11. Observability

- **[All] Uptime checks** on the site and the API health endpoint, alerting the owner's phone, before the first real user.
- **[M] Error tracking** (browser and API) before the first real user, with personal data scrubbed. Without it you learn about crashes from angry customers.
- **[M] Structured logs** (JSON) with a request ID on every line and redaction configured; log levels used properly; no log of request bodies by default.
- **[M] An activity log** of who changed what, when, with before and after, for money, permissions and settings.
- **[L] Alerts** on error spikes, slow responses, a full disk, failed jobs and failed backups.
- **[M] Runbooks** in `docs/system.md` for: the site is down; a deploy fails; the database is full; a key leaked; an account is under attack; restore from backup.

## 12. Backups and recovery

- **[M] Back up from day one,** daily at least, plus point-in-time recovery for the main database when the host offers it.
- **[M] Stored somewhere else** than the data (another provider or region), encrypted, with retention written down.
- **[M] Test a restore,** on a scratch database, at set-up and then monthly. A backup never restored doesn't count.
- **[M] Uploaded files** backed up or versioned too.
- **[All] The repository** is a backup of the code only; the owner keeps a copy of anything not in Git (secrets, keys) in a password manager.

## 13. Dependencies

Before adding one, say:

1. What it's for, and why the platform, the stack or 20 lines of our own code won't do.
2. Its size (for the frontend), maintenance (recent releases, open issues), downloads, licence, and whether it compiles native code (flag it; prefer prebuilt binaries for the owner's OS).
3. Its age: no versions released in the last day or so.

Remove dependencies that are no longer used (the dead-code check finds them).

## 14. Documentation

- **[All]** `docs/commands.md`, `docs/decisions.md` and the task lists are always true.
- **[M]** `docs/system.md` describes the running system (hosts, deploys, data, security layers, limits, monitoring, costs, backups, runbooks) and changes in the same commit as the system.
- **[L]** `docs/scaling.md` and an audit file per audit.
- **[All]** Comments explain why, citing IDs; the code explains what.

## 15. Before the first real users

- [ ] Security review against `SECURITY.md`; critical and high findings fixed.
- [ ] Uptime checks and error tracking live, alerts reach the owner's phone.
- [ ] Backups running, one restore tested.
- [ ] Legal pages live (privacy, terms, cookies if used); data protection registration if the law requires it.
- [ ] Load test run, numbers recorded.
- [ ] The owner has run through the main journeys on a real device, with test data only.
- [ ] Support route ready (an email or WhatsApp number, a reply-time promise).
- [ ] Two-factor on every account; domain on auto-renew.
