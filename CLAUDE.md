# Five Clover group website and PMS

fivecloverhotels.com: the Five Clover Hotels Group's public website, and the PMS at `/pms` that every branch and Head Office use. Next.js (App Router), exported as static files to Cloudflare; the PMS calls the backend in `../five-clover-nestjs-backend`.

PMS users are front-desk staff new to a PMS, on front-desk PCs and phones (installed as an app) over Lagos mobile data. Plain words, large type, every change confirmed.

The owner's own rules are also in `../CLAUDE.md` and in the AI's memory, and the backend's `CLAUDE.md` holds the rules shared by every Five Clover repository. Where they and the kit differ, the owner's rule wins.

## Where things live

| Role (AI coding kit) | File |
|---|---|
| How to work | `docs/ai/AI-README.md` (read every session) |
| Context | `docs/ai/CONTEXT.md` (this site) and `../five-clover-nestjs-backend/docs/ai/CONTEXT.md` (the business) |
| Standards, design, security | `docs/ai/STANDARDS.md`, `docs/ai/DESIGN.md`, `docs/ai/SECURITY.md` |
| Decisions | `../five-clover-nestjs-backend/docs/decisions.md` (one log for all Five Clover repositories) |
| Spec and plans | The backend's `docs/*-PLAN.md` |
| How the system works | `../five-clover-nestjs-backend/docs/HOW-THE-SYSTEM-WORKS.md`; SEO in `docs/SEO_*.md` |
| The AI's to-do list and the owner's to-dos | `../five-clover-nestjs-backend/docs/AI-TO_DOS.md` and `docs/TO-DOS.md` |
| Audits | `docs/audit-2026-11.md` |
| PMS conventions | The PMS registries: `src/components/pms/pmsNavItems.js` (pages and roles), `src/lib/pms/tips.js` ((i) tips), `src/components/pms/ui.js` (styles) |

## Stack

- Next.js 16 (App Router), React, Tailwind CSS v4; `output: 'export'`, so no server code, redirects or headers (those go in `public/_headers`).
- The PMS: `src/app/pms/*` routes, `src/components/pms/*`, `src/lib/pms/*` (API client, session, dates, tips). Live updates over Socket.IO (`components/pms/live/PmsLive.jsx`).
- Tests: Vitest (`npm test`). Lint: ESLint (`npx eslint <files>`). Build: `npm run build` (writes `out/`).
- Development on Windows 11; the owner's dev server runs on port 3001: never stop it.

## Hard rules

- **Commits:** one line, `(type): Description`, approved by the owner first; never a "Co-Authored-By" line. Pushing `main` deploys to Cloudflare.
- **Never commit** `.env.development.local` (never `git add -f` it), the local dev-port line in `package.json`, or `.wrangler/`.
- **Never read or edit `.env`-style files.**
- **The server decides who may do what;** a page's roles in `pmsNavItems.js` must match the backend's `@Roles`.
- **Every PMS edit is a dialog,** asked twice; every page top is `PageHeader` (+ `PageTabs`); tabs are `role="tab"`.
- **(i) tips** on headings, fields and columns only, from `lib/pms/tips.js`.
- **No "Loading..." text** (spinners); **never a min-width on date fields.**
- **No polling** for new work; push updates (see AUD-W03 for the timers that remain).
- **No secrets in the bundle;** only `NEXT_PUBLIC_*` values meant to be public.

## How to work

- Follow `docs/ai/AI-README.md`, with the owner's rules above where they differ.
- Check a PMS change in a browser against the local test backend before calling it done (the backend's `CLAUDE.md` and the AI's memory hold the recipe).
