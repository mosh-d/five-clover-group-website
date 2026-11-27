# Project context: the group website and the PMS

The business itself (users, business rules BR-nn, glossary, roles, money, privacy, accounts, constraints) is written once, in the backend: `../five-clover-nestjs-backend/docs/ai/CONTEXT.md`. Read it too. This file adds only what belongs to this repository. Filled in on 2026-11-27 when the AI coding kit was adopted; lines marked **(inferred, confirm)** are the AI's reading.

## 1. The product in one paragraph

fivecloverhotels.com: the Five Clover Hotels Group's public website (the group, its brands and branches, links to each hotel's own site for booking), and, under `/pms`, the PMS every branch's staff and Head Office use. One Next.js app, exported as static files and served by Cloudflare (free plan); the PMS talks to the backend API on Render.

**Tier:** L for `/pms` (money, personal data, many branches); S for the public pages.

## 2. Users

- **Public pages:** guests and companies looking for a Lagos hotel, mostly on phones over mobile data (inferred, confirm).
- **The PMS:** branch staff and Head Office (see the backend's CONTEXT section 2). Installed as an app (PWA) on front-desk PCs and phones.

## 10. Brand (group website)

- **Name:** Five Clover Hotels (Five Clover Hotels Group).
- **Colours** (tokens in `src/app/globals.css`):

| Name | Value | Role |
|---|---|---|
| `--emphasis` | hsla(38, 49%, 51%) gold | Primary action, highlights |
| `--accent` | hsla(38, 86%, 80%) | Accent |
| `--accent-2` | hsla(38, 26%, 84%) | Borders |
| `--text-color` | hsla(38, 13%, 18%) | Text |
| `--black` | hsla(0, 0%, 2.4%) | Headings |
| `--background-color` | hsla(38, 38%, 94%) cream | Surface |

  The PMS takes each branch's brand colours (`components/pms/theme/brands`).
- **Type:** Jost (body) and Playfair Display (headings) on the public pages; Inter for the PMS body (`.pms-type`), Playfair Display for PMS page titles. Loaded with `next/font`.
- **Dark mode:** no (inferred, confirm).
- **Readable type:** pixel floors on the public pages only; the PMS opts out.

## 11. Voice and writing

As the backend's CONTEXT section 11. In the PMS: Title Case buttons and headings, (i) tips on headings, fields and columns (never buttons or tabs), every change confirmed in a dialog.

## 12. Content and reach

- **Pages:** home, about, the brands and branches, contact, privacy policy, terms of service; the blog is paused (`docs/BLOG-PAUSED.md`).
- **Who edits content:** the owner, through the code (inferred, confirm).
- **Search:** `docs/SEO_*.md`; structured data from `components/seo`; `robots.txt` and `sitemap.xml` generated at build.
- **Analytics and cookies:** Google Tag Manager / Google Analytics (`components/seo/GoogleAnalytics.jsx`), when its id is set; no cookie consent banner.
- **Legal pages:** `/privacy-policy`, `/terms-of-service`.

## 14. Constraints

- Static export only (`output: 'export'`): no server code, no server redirects or headers; headers live in `public/_headers` (Cloudflare).
- Cloudflare free plan; Vercel served the site before and `vercel.json` may still be read there.
- Never commit `.env.development.local` (points the PMS at the owner's local backend), the local dev-port line in `package.json`, or `.wrangler/`.
