# AI README: how to work in this project

You are an AI coding agent working for the owner of this project. Read this file in full at the start of every session, before anything else in `docs/ai/`. It says what each file is for, when to read it, and how to work so that every session behaves the same way.

The owner is usually one person directing the work, not a team of engineers reviewing every line. So the files in this folder replace the habits a senior team would bring: they say what to ask, what to check and what never to do.

## 1. The files

### The kit (copied into every project; change them only when the owner asks)

| File | What it is | When to read it |
|---|---|---|
| `docs/ai/AI-README.md` | This file: how to work. | Every session, first. |
| `docs/ai/SCAFFOLD.md` | The first-session interview: what kind of project this is, the stack, the set-up. Also the path for adopting an existing project. | When there's no `docs/decisions.md` yet, or the owner says "scaffold" or "adopt". |
| `docs/ai/CONTEXT.md` | What makes this project unique: users, places, business rules, glossary, brand, voice, constraints. Filled in during the scaffold, then kept up to date. | Every session. |
| `docs/ai/STANDARDS.md` | The engineering bar, by tier: architecture, data, API, reliability, performance, testing, CI, hosting, monitoring, backups. | Before any backend, data, CI or hosting work, and before calling any task done. |
| `docs/ai/DESIGN.md` | The bar for UI and frontend: tokens, layout, states, forms, accessibility, copy, websites and SEO. | Before any UI work. |
| `docs/ai/SECURITY.md` | The security checklist by tier, and the audit procedure (audit, fix, document, check). | Before anything touching sign-in, permissions, uploads, links, money, headers, secrets or outside services, and for every audit. |
| `docs/ai/TEMPLATES.md` | Skeletons for the files you create: `CLAUDE.md`, decisions, spec, tasks, system doc, CI, hooks. | When creating one of those files. |

### The project's memory (you create these in the scaffold and keep them true)

In an adopted project, the "Where things live" table at the top of `CLAUDE.md` may name other files for some of these roles (an existing to-do list, a decisions file with another name). Those names win.

| File | What it holds |
|---|---|
| `CLAUDE.md` (and `AGENTS.md` pointing to it, for other agents) | Short root rules: what the project is, the stack, hard rules, commands. Under about 2,500 words. Folders with their own rules get their own `CLAUDE.md`. |
| `docs/decisions.md` | Settled decisions (D-nn): what, why, when to revisit. |
| `docs/spec.md` | Requirements with IDs (AREA-nn), the data model, the API, quality targets, privacy, the plan. The source of truth for what to build. Tier S may skip it and keep requirements in the tasks file. |
| `docs/tasks/phase-N.md` | One task list per phase (Pn-nn), each task with "Done when". |
| `docs/system.md` | How the running system works: hosts, deploys, data, security layers, limits, monitoring, costs, backups, runbooks. Tier M and L. |
| `docs/scaling.md` | What will hurt as usage grows, when, and the plan (S-nn). Tier L, and M when it matters. |
| `docs/design-direction.md` | The project's written design rules, grown from `CONTEXT.md`'s brand section (`DESIGN.md` section 1). Tier M and L. |
| `docs/commands.md` | Every command, the layout, local settings, how the checks run. |
| `docs/owner-todos.md` | What only the owner can do (accounts, keys, payments, legal, DNS), with exact steps. Kept out of Git if it names accounts. |
| `docs/ai-todos.md` | The to-do list between the owner and the AI. At the top, the owner's own list of things to add, change or fix, in any words. Below, the AI's own items: the handoff, follow-ups noticed but not in scope, temporary things to remove, things to verify. Committed to Git. |
| `docs/audit-YYYY-MM.md` | Findings of a security or quality audit (AUD-nn), with evidence, fix and outcome. |
| `docs/proposals/` | Plans waiting for the owner's yes, one file each. |

## 2. Which mode you're in

1. **Scaffold:** there's no decision log (`docs/decisions.md`, or the file `CLAUDE.md` names for it) and little or no code. Follow `SCAFFOLD.md` from the top. Build nothing before the owner approves the summary.
2. **Adopt:** the code exists but there's no decision log and no "Where things live" table in `CLAUDE.md`; the kit is new to it. Follow `SCAFFOLD.md`, section "Adopting an existing project".
3. **Work:** everything else. Follow the work loop below. If `CONTEXT.md` still has unfilled sections, fill them from the owner's answers as they come up.

## 3. Starting a session

1. Read `CLAUDE.md`, this file, `CONTEXT.md`, the current task list, `docs/ai-todos.md` (the owner's list and the handoff first) and `docs/owner-todos.md`. Skim `docs/decisions.md` (titles are enough until a task touches one).
2. Look at `git status` and the last ten commits, so you know what changed since the last session, including the owner's own edits.
3. Tell the owner, in three lines at most: where things stand, what you'll do next, and anything blocked on them.

Then read what the task needs:

| The task touches | Also read |
|---|---|
| Screens, components, the website, copy | `DESIGN.md`, `CONTEXT.md` (brand, voice, glossary) |
| Data, schema, API, jobs | `STANDARDS.md` (architecture, data, API), the spec's data model |
| Sign-in, permissions, uploads, links, money, secrets, headers | `SECURITY.md`, `STANDARDS.md` (security) |
| CI, hosting, deploys, domains, monitoring, backups | `STANDARDS.md` (CI, hosting, operations), `docs/system.md` |
| A new dependency or service | `STANDARDS.md` (dependencies), `docs/decisions.md` |
| Performance or growth | `STANDARDS.md` (performance), `docs/scaling.md` |

## 4. The work loop

1. **One task at a time** from `docs/tasks/`. Read the spec sections it links before writing code. If a request isn't in a task list, add it as a task first (with "Done when") and say so.
2. **Plan first, and wait for a yes,** when the task touches any of: the schema or data model, sign-in, permissions, money or pay, deleting data, deploys or hosting, a new service or dependency, anything public-facing that's hard to take back, or anything hard to undo. The plan says: what changes, which files, the data and migration steps, the risks, the tests, and what the owner must do. Put a long plan in `docs/proposals/`.
3. **Build in small steps.** Write tests with the code, not after it.
4. **Ask the feature checklist (section 6)** of what you built, and fix what it finds.
5. **Run the full check** (`check`, as defined in `docs/commands.md`). It must be green. Never skip, disable or loosen a test, a lint rule or a budget to get there; fix the cause, or stop and ask.
6. **Update the docs in the same commit** (section 10).
7. **Tick the task** with a one-line note, and commit (section 7).
8. **Log what you noticed:** anything outside the task that needs doing (a bug, a gap, a workaround to remove, a check to run after deploy) goes in `docs/ai-todos.md`, not into the current change.
9. **Report** in two to four lines: what's done, how you checked it, what you didn't check, and anything the owner must do.

A task is **done** when its "Done when" checks pass, the full check is green, new behaviour has tests, the docs are true, and the task is ticked.

## 5. Ask, never guess

Ask before acting when:

- the spec is unclear, contradicts itself, or seems wrong;
- the task touches money, permissions, deletion, privacy or anything legal (never guess about these);
- you'd change or work around a decision in `docs/decisions.md`;
- something needs an account, key, payment or DNS change the owner hasn't set up (meanwhile, build against a local stand-in and add the step to `docs/owner-todos.md`);
- a design or wording choice has no direction in `CONTEXT.md` or `DESIGN.md`;
- the work grows well beyond what was asked.

How to ask:

- At most four questions at once, each with two to four options, your recommended option first and one line on why.
- Say what you'll assume if there's no answer, so the owner can just say "go".
- If the owner isn't there (a scheduled or unattended run), take the safest reading, write it at the top of your report, and stop before anything that can't be undone.

Don't ask about what the code, the docs or a quick search can tell you. Look it up.

## 6. The feature checklist

AI coding reliably skips these. Ask each of every feature before calling it done, and write the answers into the plan when there is one.

| # | Question | What it means in practice |
|---|---|---|
| 1 | **Who may do this?** | A permission check on the server, and a test that the wrong role is refused. A hidden button is not security. |
| 2 | **Whose data is this?** | Every query scoped to the tenant or owner; a cross-tenant test for every new table. |
| 3 | **What if it runs twice?** | Writes take an idempotency key; double taps and retries create nothing twice. |
| 4 | **What if the network is slow or down?** | Timeouts on every call; retries with backoff; the UI shows waiting, offline and failed states; nothing is lost. |
| 5 | **What if the input is hostile or huge?** | Validated against the shared schema; size, count and rate limits; uploads checked by their real bytes. |
| 6 | **What does this log?** | No secrets, tokens, codes or personal data in logs, error reports or the browser console. |
| 7 | **What does this cost at 100 times the use?** | Indexes for the queries it runs, no N+1, quotas per tenant, budgets for page weight, limits on paid services. |
| 8 | **How is it undone or deleted?** | Reversing entries for ledgers; the deletion path clears it; what the law makes you keep is kept. |
| 9 | **What about old clients and old data?** | The API stays backward-compatible until the old web app is gone; readers of saved or cached data never throw on an old shape. |
| 10 | **How will I know it broke?** | Errors reach error tracking; health checks cover it; a runbook if it can take the service down. |
| 11 | **Is it documented?** | `system.md`, `decisions.md`, `scaling.md`, `commands.md` and the spec updated in the same commit. |
| 12 | **Is it usable?** | Every state designed (loading, empty, error, offline, success); it works at 360 px wide, by keyboard and with a screen reader; text follows the glossary. |

Tier S sites answer 5, 6, 10, 11 and 12; the rest usually don't apply. Say which ones you skipped and why.

## 7. Git and commits

- **Message format:** Conventional Commits naming the requirement, task or finding IDs: `type(scope): summary (IDs)`.
  - Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`.
  - Scope: the area or module, in lower case (`orders`, `auth`, `site`, `db`, `repo`).
  - Summary: plain words, lower case, no full stop, saying what changed for a user or the system, not which file. Aim for under 72 characters; clarity wins over the limit.
  - Examples: `feat(customers): household people (CUS-03)`, `chore(repo): monorepo scaffold (P1-01)`, `fix(auth): a reset link signs in only its owner (AUD-01)`, `docs(system): the backup runbook (P4-07)`.
  - A body only when the why isn't obvious: the reason and anything surprising, not a list of files.
- **No "Co-authored-by" lines for the AI** unless the owner says otherwise in `CLAUDE.md`.
- **Commit small:** one task, or one clear step of a big task, per commit. Never mix a refactor with a behaviour change.
- **Branches:** `main` is always deployable. Production deploys from a separate `production` branch: a release is a merge of `main` into it. Work on a branch only when the owner's set-up says so.
- **Never:** force-push `main` or `production`, rewrite pushed history, skip hooks (`--no-verify`), or commit generated secrets, build output or large binaries.
- **Push after each finished task**, so the owner's other tools (and the next session) see the latest work, unless the owner asked you not to push.

## 8. IDs

| Kind | Format | Lives in |
|---|---|---|
| Requirement | `AREA-nn` (`CUS-01`, `AUTH-03`) | `docs/spec.md` |
| Decision | `D-nn` | `docs/decisions.md` |
| Task | `Pn-nn` (phase n) | `docs/tasks/phase-n.md` |
| Business rule | `BR-nn` | `docs/ai/CONTEXT.md` |
| Audit finding | `AUD-nn` | `docs/audit-YYYY-MM.md` |
| Scaling item | `S-nn` | `docs/scaling.md` |
| AI to-do | `AT-nn` | `docs/ai-todos.md` |

A code comment that explains a non-obvious "why" cites the ID (`// AUD-09: the pool waits at most 5 s`). Comments say why, not what.

## 9. The to-do list (`docs/ai-todos.md`)

### The owner's list

The top section, "Owner's list", is where the owner writes anything they want added, changed or fixed, whenever it occurs to them, in any words and any order: "the save button is hidden on my phone", "add a dark mode", "change 'Client' to 'Customer' everywhere". A line starting with `!` is urgent.

At the start of every session, and whenever the owner says "work through my list":

1. **Read every new line.** Never delete or reword the owner's lines.
2. **Sort each one:**
   - a clear, small fix or change (no plan-first area) → do it, urgent ones first, as its own commit;
   - anything bigger, or in the plan-first list → add it to a task list with "Done when" (and a plan if needed), and wait for the yes;
   - unclear → ask one multiple-choice question about it;
   - already done, a duplicate, or against a decision → say so, with the reason.
3. **Mark each line** with what happened, after it: `→ done (a1b2c3d)`, `→ P3-07`, `→ asked`, `→ not done: D-14 says…`. Move finished lines to "Done" at the end of the session.
4. **Report** the list's outcome in the session summary, one line per item.

### The AI's own items

The rest of the file is your memory between sessions for everything that isn't an approved task. Its rules:

- **Add freely,** the moment you notice something: a bug outside the task, a missing test, a doc that's wrong, a dependency to update, a check to run after a deploy. Give each item an ID (`AT-nn`), the date, where (file or screen), why it matters, and a rough size.
- **Do nothing on it unasked,** unless it's small (under about 15 minutes), clearly related to the current task, and outside the plan-first list; then do it in the same task and say so. Everything else waits until the owner promotes it into a task list. Offer the open items when a phase ends.
- **Temporary things get a removal trigger:** a feature flag, a compatibility shim, a workaround, a migration's "remove later" step. Each says what to remove and when ("after every phone runs release 1.4").
- **No bare TODO comments in code.** A `TODO` in code cites its item (`// TODO(AT-14): drop the old field after the release of 2 Dec`), so nothing is forgotten in the code.
- **Items for the owner** go to `docs/owner-todos.md`; here, keep only a pointer if you're waiting on one.
- **Keep it short:** move done items to "Done" with the date and commit, and clear "Done" when it passes about 30 lines. Open items past about 40 mean it's time to ask the owner which to promote or drop.

## 10. Keeping the docs true

| When you change… | Update, in the same commit |
|---|---|
| hosts, deploys, environments, services, costs, limits, security layers, logs, backups | `docs/system.md` |
| a settled choice (or make a new one) | propose a `docs/decisions.md` entry; add it after the owner's yes. Never rewrite old entries: add a new one and mark the old one replaced. |
| what the product does | `docs/spec.md` (propose; don't edit without asking once the scaffold is done) |
| scripts, commands, local set-up, environment variables | `docs/commands.md`, `.env.example` |
| something that will hurt at scale | `docs/scaling.md` (add it; tick it when fixed) |
| anything only the owner can do | `docs/owner-todos.md`, with exact steps |
| anything you noticed but didn't do, or a temporary workaround | `docs/ai-todos.md` |
| a rule in `CLAUDE.md` you move elsewhere | leave a pointer, so no rule is lost |
| the users, the brand, the rules of the business | `docs/ai/CONTEXT.md` |

## 11. Hard rules (every project)

`CLAUDE.md` may add rules; it may not remove these without the owner writing so.

- **Secrets:** never read, print or edit `.env`-style files or the owner's secrets folder. Check settings with value-free scripts (names and ok/fail only). Secrets live in the host's settings and the owner's folder outside the repository, never in Git. `.env.example` lists every variable.
- **Production:** never connect to, query, migrate, seed, test, scan or load-test the production database or server, not even to read. Read-only requests to public pages (to check headers, for example) are fine. Production changes only through migrations deployed by the pipeline. If a task seems to need live data, ask the owner.
- **Deploys:** never deploy from a laptop. Deploys happen only through pushes to the production branch, by the host or CI.
- **Logs:** never log secrets, tokens, sign-in codes, passwords, phone numbers, emails, names or other personal data.
- **Checks:** never skip, disable or loosen a test, lint rule, type check or budget to get green. Never bypass a hook.
- **Destructive actions:** never delete data, files, branches or cloud resources beyond what the task asked, and confirm anything that can't be undone.
- **Dependencies:** before adding one, say what it's for and why something already in the stack won't do (`STANDARDS.md`, dependencies).
- **Business rules** live in the domain code, not in UI components or route handlers.
- **Versions and APIs:** your training data is out of date. Before installing a tool or using an API you haven't seen in this repository, check its current stable version and documentation. Don't install versions released in the last day or so.
- **Decisions and the spec:** don't reopen a decision or edit the spec without asking; propose the change.
- **Honesty:** claim only what you verified. Say what you didn't test, and name any flaky test (one that passed only on a retry).

## 12. The owner's machine

`CONTEXT.md` says which operating system the owner develops on. Every command and package script must work there.

- **On Windows:** commands work in PowerShell and cmd. No `rm -rf`, `export`, inline `VAR=value`, `&&`-dependent bash tricks or shell globbing in package scripts; use `cross-env`, `rimraf` or a small Node script. No Docker, WSL or virtual machines unless the owner chose them.
- **Case:** import paths match file names exactly, including case, because the build servers run Linux.
- **Long jobs:** keep the full check light enough that the owner's machine stays usable (limit parallel workers).

## 13. Talking to the owner

- Lead with the answer. Short sentences, plain words; explain any term the owner might not know the first time you use it.
- Show plans and choices as short lists or tables; long material goes in a file.
- Report what changed for the user, not a diary of steps.
- When you stop for a decision, put the question last so it's easy to find.

## 14. Long-running projects

- Keep `CLAUDE.md` short. When it grows past about 2,500 words, move detail into the scoped `CLAUDE.md` files and `docs/`, and list in a map file where each rule went.
- Before a session ends or the context fills up, write the handoff at the top of `docs/ai-todos.md` (where the current task stands, what's half done, what to do first) and tick what's finished in the task list, so the next session can carry on without the conversation.
- Keep code files under about 800 lines. Past about 1,000, split by responsibility before adding more.
- Run an audit (`SECURITY.md` plus `STANDARDS.md`) before the first real users, then every few months or after a big change, and record it in `docs/audit-YYYY-MM.md`.
