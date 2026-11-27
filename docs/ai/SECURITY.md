# Security

How to keep the project from crashing, being hacked, leaking data, running up an unexpected bill or failing to scale, and how to audit it. Tiers are tagged as in `STANDARDS.md`: **[All]** every project, **[M]** apps with accounts or stored data, **[L]** multi-tenant, money, offline or high-growth apps. `STANDARDS.md` section 5 is the short version; this is the full guide.

## How to use this file

- **While building:** before a task touches sign-in, permissions, uploads, links, money, headers, secrets, outside services or anything public, read the checklist sections it touches (part 2) and build to them. The feature checklist in `AI-README.md` section 6 asks the same questions of every feature.
- **Auditing:** when the owner asks for an audit, when adopting an existing project, before the first real users, and every few months after, follow part 1 from the top.
- **Fit everything to this repository:** name its real files, tools, hosts and commands ("check `src/server/auth.ts`", not "check the auth code"). Leave out what doesn't apply, and say what you left out and why (no SQL database, no SQL injection to check).
- **Never invent findings.** Mark anything you couldn't verify "to check".

## Part 1: the audit

### Step 1. Learn the repository

Read the code, `CLAUDE.md` and `AGENTS.md`, `docs/`, the package manifest and lockfile, config and deploy files, and the main folders. Write down:

- **The stack:** languages, frameworks and versions; the database and ORM; file storage; auth; the email, SMS, payment and AI providers.
- **Where it runs:** hosting for the frontend, API and database; the CDN or proxy; environments; how deploys happen.
- **Who uses it:** users, roles, tenants (one business or many), admins.
- **What data it holds,** and which is personal, financial or sensitive.
- **What already exists:** security measures, tests, CI and hooks, monitoring, backups, docs.
- **What's live:** real users, real data, anything that costs money.
- **The rules the repository already sets** (banned tools, deploy rules, never touching production). The audit keeps all of them.

Note real problems as you read, each with its file and line. They lead the audit.

### Step 2. Ask what the repository can't tell you

Up to five questions in one message, only what the code and docs can't answer: what's live, the budget for tools, which accounts the owner holds, rules to keep, which data protection law applies, how much downtime is acceptable. If the owner isn't there, take the most sensible reading and say what you assumed.

### Step 3. The rounds

Stop after round 1 for the owner's OK. If the work is too big for one session, split it (audit; fixes by area; docs) and say so; write where you stopped in the handoff in `docs/ai-todos.md`.

1. **Round 1, audit.** Write `docs/audit-YYYY-MM.md`. Every checklist item in part 2 that applies is marked **In place**, **Partly**, **Missing** or **Not applicable**, with its evidence (file and line, or the command and its output) and, when not in place, a severity and a finding ID (`AUD-nn`, continuing from earlier audits). Then show the owner: the findings by severity, the order of fixes, every decision needed from them, and what you left out and why.
2. **Round 2, fix.** One finding per commit, highest severity first, each with a test that would have caught it: `fix(auth): a reset link signs in only its owner (AUD-01)`. Anything that changes a decision, the schema, sign-in, permissions, money or deploys gets a plan and waits for the owner's yes. Record each fix's outcome against its finding.
3. **Round 3, document.** Bring `docs/system.md` up to date (part 4) and add the owner's to-dos (part 5) to `docs/owner-todos.md`.
4. **Round 4, check.** The full `check` is green; anything that only exists on the live host (headers, firewall rules, redirects) is checked on a preview deploy or with read-only requests to the public site, never by touching the production server or data.

### Severity

| Severity | Means | Examples |
|---|---|---|
| **Critical** | Anyone can take over accounts, read or change another tenant's data, run code, or empty a bill, now | A reset link that signs in as someone else; a route with no permission check; unlimited uploads to a public bucket; a live key in the repository |
| **High** | Serious harm with some effort or some condition | No rate limit on sign-in codes; personal data in logs; no backups; IDOR behind sign-in |
| **Medium** | Weakens a defence, or harm is limited | Missing CSP; framework headers exposed; session not rotated after sign-in |
| **Low** | Hardening and hygiene | Generic cookie names; dead code; a missing `Permissions-Policy` |

### Ground rules (on top of `AI-README.md` section 11)

- Never touch production or live data, and never run a scanner or load test against production; read-only requests to public pages are fine.
- Never read or print secrets or `.env` files; use value-free checks (names and ok/fail only).
- Plan before changing auth, permissions, the schema, money or deploys.
- Ask rather than guess about money, permissions and deletion.
- Keep every rule the repository already sets.

### Done when

- [ ] The audit lists every applicable checklist item with its status, evidence and severity, and the owner has seen it.
- [ ] Every Critical and High finding is fixed with a test. Medium and Low are fixed, or listed with a plan in a task list.
- [ ] The dependency audit shows no high or critical advisories in what ships.
- [ ] No response, on any host or kind of response, reveals a framework, server or version that can be hidden, and a test guards it.
- [ ] `docs/system.md` and the owner's to-dos are up to date.
- [ ] The full `check` is green.

## Part 2: the checklist

### 1. The edge: network, firewall, DDoS and bots

- **[All]** Behind a proxy or CDN with a web application firewall: IP blocking, bot protection, DDoS rules, and country or ASN challenges on sign-in routes only (never on the whole site).
- **[M]** Origin lock: the origin can't be reached directly, bypassing the proxy (a secret header, allow-listed proxy IPs, or a tunnel).
- **[M]** The real client IP is read only from the proxy's header, and only when the request provably came from the proxy.
- **[All]** HTTPS everywhere: redirects, HSTS, a minimum TLS version; **[M]** TLS from the app to its database and services.
- **[M]** CORS allows only the app's own origins, with credentials only where needed.
- **[M]** CSRF: cookies `SameSite`, and state-changing requests check the `Origin` header (or a token) on any route a cookie authenticates.
- **[All]** Open redirects: any "return to" or "next" parameter only goes to the app's own paths.

### 2. Abuse and runaway costs

- **[M]** Rate limiting per IP, per account and per tenant on every route; a write route with no limit is a finding. **[All]** Public forms are limited too. Expensive routes (search, exports, reports, AI calls) get their own limits. Counts are kept somewhere that survives deploys and is shared between instances (the database, not process memory). IPv6 addresses are grouped by /64.
- **[M]** Request throttling for bursts, and a backstop limit for the whole service.
- **[M]** Brute-force protection on passwords, PINs, codes, reset links, invite links and public tokens. Lockouts must not let a stranger lock a real person out (slow down and challenge rather than lock).
- **[All]** A challenge (Turnstile, hCaptcha or reCAPTCHA) on sign-up, password reset and public forms, and on sign-in after a few failures.
- **[L]** Usage quotas per tenant: records, storage, requests a day, exports a day, emails and SMS a day. One tenant must not be able to use up a shared allowance (an email quota spent on invites stops sign-in codes for everyone).
- **[M]** Cost controls: every service that can bill more than its fixed price (SMS, email, storage, bandwidth, AI tokens, maps, serverless functions) has a cap, an alert, and something that stops a runaway bill.
- **[M]** No polling: nothing calls the server on a timer when a push, server-sent events or a cache would do. List every timer that calls the API.

### 3. Sign-in and sessions

- **[M]** Session tokens live only in `HttpOnly`, `Secure`, `SameSite` cookies scoped to the API's host: never in `localStorage`, `sessionStorage`, IndexedDB, URLs or logs. List everything the app keeps in browser storage, and confirm sign-out clears it.
- **[M]** Sessions are random, stored hashed, expire, rotate after sign-in, and end when the password or email changes; "sign out everywhere" exists.
- **[M]** Two-factor sign-in (an emailed code, an authenticator app or passkeys), required for admins, with recovery codes.
- **[M]** Passwords, if used: at least 8 characters, not among the most common and not the email; hashed with argon2id (or bcrypt at its current cost); checked against breached passwords if possible.
- **[M]** Reset, invite and magic links are as powerful as a password: single use, short-lived, bound to one account, stored hashed, and they never sign in anyone but their owner.
- **[M]** No account enumeration: sign-in, sign-up and reset never reveal whether an account exists, by their words or their timing.
- **[M]** Admin checks happen on the server on every request, whatever the app shows. Sensitive changes (password, email, two-factor, payouts, roles) need a recent sign-in.

### 4. Access control and data isolation

- **[M]** Every route checks role and permission on the server. A test fails when a route has no check. Hiding a button is not security.
- **[M]** IDOR: every ID in a path, query or body is checked to belong to the caller (and their tenant) before use, with a test per route family that tries another tenant's or user's IDs.
- **[M]** Mass assignment: no update accepts a field the caller may not set (role, owner, tenant, plan, price, status). Schemas reject unknown keys.
- **[L]** Tenant isolation in the architecture: every tenant-owned table carries the tenant ID; queries always filter by it; row-level security (or the equivalent) is the second line; the app's database role can't bypass it; a cross-tenant test per table.
- **[M]** Least privilege: separate database roles for the app and for migrations; scoped API keys for every service; no admin keys in the app; the frontend holds no secret at all.

### 5. Input and output

- **[All]** Validate all input on the server with schemas: params, query, body, headers and uploads. **[M]** Validate responses too.
- **[M]** SQL injection: parameterised queries only, raw SQL only with constants, and a lint rule that enforces it. NoSQL injection where it applies.
- **[All]** Escape user content everywhere: pages, emails, PDFs, and CSV exports (cells starting with `=`, `+`, `-` or `@`, against formula injection). Check every `innerHTML`, `dangerouslySetInnerHTML` and `v-html`.
- **[M]** Server-side request forgery: any feature that fetches a URL a user gave is limited to safe hosts and blocks internal addresses.
- **[M]** Path traversal: anything that reads or writes files by a name a user gave.
- **[M]** Trim API responses to what the screen needs: never hashes, tokens, internal flags, staff-only notes or other tenants' data.
- **[All]** Generic errors to the client: one shape, no stack traces or SQL. Details go to the logs only.
- **[All]** Third-party scripts: as few as possible, loaded from allowed hosts in the CSP, with Subresource Integrity where the file is fixed.

### 6. File uploads [M]

- Allowed types checked by the file's first bytes, not its name or the type the browser claims.
- Limits: the exact size and type signed into the upload link; links short-lived and write-once; a number of files per record; a storage quota per tenant.
- Images re-encoded on the server (which also strips location and other metadata).
- Storage: private buckets with short-lived signed links; unconfirmed uploads cleaned up automatically; public files can't be replaced by another upload.
- Never serve an upload as a type that runs: no SVG, HTML or JavaScript, or serve them with `Content-Disposition: attachment` from another domain.

### 7. Sensitive data

- **[M]** A personal data inventory: every place personal data lives (database, file storage, logs, error tracking, analytics, browser storage, emails, exports, backups), who can see it, and how long it's kept.
- **[M]** Encryption and hashing: at rest and in transit; tokens, codes and API keys hashed; encrypted columns proposed for what would hurt most if leaked, weighed against search.
- **[M]** Logs and error tracking never hold phone numbers, emails, names, tokens, codes or payment details. Redaction is enforced in code (the logger's config), and tested. The same for the browser console.
- **[L]** Client-side privacy: nothing sensitive in the tab title, notifications or share previews; an optional "hide amounts" mode that blurs money and contact details on screen; the screen covered when the app goes to the background, so the app switcher shows nothing.
- **[M]** Audit log: who, what, when, on whose behalf, before and after, and from where (session, device, a masked IP). Append-only and queryable; **[L]** tamper-evident (hash-chained, or exported under a retention lock), and reads of sensitive data logged too (exports, admin reads, bulk lists).
- **[M]** Backups: automatic, encrypted, kept off the main provider, restored once as a rehearsal, documented.
- **[M]** Deletion: one path that clears personal data everywhere it lives, keeping only what the law requires.

### 8. Information leakage and fingerprinting [All]

Make it hard to learn which tools, frameworks, servers and versions the app is built on from the browser's developer tools (the Network tab's headers, the page source, the JavaScript) or a scanner. This slows automated attacks hunting for known-vulnerable versions; it never replaces keeping dependencies patched.

- **Response headers,** on every kind of response (HTML pages, JavaScript and CSS, API JSON, images, redirects, 404s, 500s and the OPTIONS preflight). Remove or blank: `Server` (or reduce it to the proxy's generic name); `X-Powered-By`; `X-AspNet-Version` and `X-AspNetMvc-Version`; `Via`; framework and host headers such as `x-nextjs-*`, `x-vercel-*`, `x-render-*`, `x-railway-*`, `x-amz-*` and `x-goog-*` where the app controls them; `Server-Timing` in production; any header carrying a version number. No personal data or internal details in any header.
- **Keep the security headers:** a Content-Security-Policy with no `unsafe-inline` scripts, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` and `Cross-Origin-Opener-Policy`.
- **Cookies:** names that don't give the framework away (not `connect.sid`, `PHPSESSID`, `JSESSIONID`, `ASP.NET_SessionId`, `laravel_session`, `next-auth.*`), with a neutral prefix of the project's own.
- **No secrets in URLs:** tokens, codes and personal data never go in URLs or query strings (they end up in logs, history and referrers).
- **Source maps** never served publicly in production; upload them privately to the error tracker.
- **The page source:** no `<meta name="generator">`, build or version comments, debug data, internal hostnames, file paths or developer comments.
- **The JavaScript bundles:** minified, comments and banners stripped. Licence notices the law requires move to a separate notices file, never deleted. No secrets, no internal URLs that aren't needed, no version strings exposed on purpose (`window.__VERSION__`).
- **Error pages and answers:** the app's own 404 and 500 pages and one error shape; never the framework's or server's defaults, stack traces or SQL errors.
- **Files that must never be reachable:** `/.git/`, `/.env*`, `/package.json`, lockfiles, `/composer.json`, `/node_modules/`, `/.DS_Store`, backups (`*.bak`, `*.sql`, `*.zip`), directory listings, editor and CI config. Test each path on every host.
- **Endpoints that describe the system:** API docs (Swagger or OpenAPI), GraphQL introspection, health or status pages with versions, debug routes, metrics. Each is off in production, behind auth, or answers with no versions.
- **robots.txt and the sitemap** don't list admin or hidden paths.
- **What can't be hidden:** some fingerprints can't be removed without breaking the app (a framework's paths such as `/_next/`, the shape of its bundles). List them as accepted; don't break caching, security headers or the app to chase them.
- **Check it:** `curl -I` (and `curl -i` on the API) for each host and each kind of response above; the browser's Network tab; Mozilla Observatory and securityheaders.com; a fingerprinting tool such as Wappalyzer to see what an attacker still sees; and a test that fails if a banned header returns.

### 9. Code and supply chain [All]

- Dependency scanning: an audit that fails on high or critical advisories in what ships, run before every push and in CI, plus Dependabot or Renovate alerts. Upgrade what's flagged.
- The lockfile is committed; the runtime and package manager are pinned; install scripts are allowed only where a package needs them; versions published in the last day or so are held back.
- Secrets in Git: scan the whole history, not just new commits (gitleaks, trufflehog or similar); confirm no `.env` was ever committed; list keys to rotate for the owner; a scan in the pre-push hook and CI.
- Secrets at run time: kept in the host's settings and the owner's folder outside the repository; settings validated at start-up, refusing development-only drivers in production.
- Zombie code: unused files, exports, dependencies, dead feature switches, commented-out code, stale TODOs and debug code (knip, ts-prune or the stack's equivalent). Remove them.
- Package licences: flag copyleft (GPL, AGPL), unlicensed or unknown licences in what ships.
- CI itself: actions pinned, the workflow's permissions read-only by default, no secrets exposed to pull requests from forks.

### 10. Payments, webhooks and outside services [M]

- Prices and amounts are decided on the server, never taken from the client.
- Webhooks: signature verified, event ID stored, processed idempotently, answered fast with the work done in a job; replays and out-of-order events are safe.
- Payment state comes from the provider's confirmation (webhook or server-side check), never from a redirect the browser lands on.
- Every outside call has a timeout and a failure behaviour written down.

### 11. AI features (if the project calls an AI model) [M]

- User content sent to a model is treated as untrusted (prompt injection): the model gets no tool or data access beyond what that user may already see, and its output is validated before anything acts on it.
- Model output is escaped like any user content before it's shown.
- Per-user and per-tenant limits and a monthly cost cap on AI calls.
- Personal data sent to the provider is listed in the privacy policy, and minimised.

### 12. Resilience: under load or failure [M]

- Timeouts on every outbound call and every database query; connection-pool limits with a wait timeout; request and body-size limits.
- Overload: the app answers "busy, try again" (503 with `Retry-After`) instead of hanging or crashing; clients retry safely, which needs idempotency keys on writes.
- Recovery: a clean shutdown on deploys, automatic restarts after a crash, liveness and readiness checks that test something real.
- Capacity: an estimate of how many users at once the setup carries, how it was measured, what fails first, and the cheapest next step.

### 13. Monitoring and incidents

- **[All]** Uptime checks on each public host, alerting the owner's phone.
- **[M]** Errors (Sentry or similar, with personal data scrubbed), resource alerts, slow queries and failed backups are watched; for each alert, who gets it and what to do.
- **[M]** Step-by-step runbooks in `docs/system.md` for: the app is down; the database is full; an account is under attack; a key has leaked; a DDoS; a bad deploy.

### 14. Accounts and ownership [All]

- Every account the project depends on (code host, hosting, DNS and CDN, domain registrar, email, payments, every provider) is in the owner's name, with two-factor on and recovery codes stored safely.
- The domain is on auto-renew with the registrar's lock on.
- Email domains have SPF, DKIM and DMARC; app mail sends from its own subdomain.
- The code host has secret scanning and branch protection on `main` and the deploy branch.

## Part 3: legal (flag for a lawyer; never advise)

- **Assets used commercially:** every font, icon, image, illustration, sound and screenshot, with its licence or "ours". Anything unproven gets replaced.
- **Package licences** (section 9).
- **The privacy policy matches what's built:** every processor, what it receives, and where.
- **Cookies:** a consent notice where the law needs one, really blocking those cookies until accepted.
- **Retention and data rights** under the country's data protection law; any registration it requires.
- **Marketing email:** unsubscribe links, the `List-Unsubscribe` header, the sender's postal address.
- **Trademarks:** no ® before registration; third-party brand rules (for example Google's sign-in button).

## Part 4: `docs/system.md`

Plain English, for someone who knows web apps but didn't build this one, with diagrams. The outline is in `TEMPLATES.md` section 5. For security, make sure it covers: each security layer, what it stops and where it lives in the code; costs and what makes each bill grow; assets and licences; and the runbooks above. It stays true from then on: any change to these areas updates it in the same commit.

## Part 5: the owner's to-dos

Add to `docs/owner-todos.md` what only the owner can do, each with why it matters, the steps and the cost:

- Two-factor on every account (section 14).
- Error tracking, analytics and uptime monitoring: create the projects and alert rules.
- The proxy and firewall: its settings, HTTPS rules and billing alerts.
- The code host: Dependabot or Renovate, secret scanning, branch protection on the deploy branch.
- Code review tools (for example CodeRabbit), if wanted, with the options and their costs.
- Rotating any key the history scan finds, and a reminder to rotate keys every 6 to 12 months.
- A lawyer's review of the legal pages, and any registration the data protection law needs.
