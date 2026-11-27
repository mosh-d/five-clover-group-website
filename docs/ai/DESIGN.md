# Design and frontend standards

How screens and pages should look, read and behave. The project's own look (colours, type, voice, references) is in `CONTEXT.md`, sections 10 and 11; this file is how to use it. Tiers are tagged as in `STANDARDS.md`: **[All]**, **[M]**, **[L]**.

## 1. Before any UI work

- **[All] Read** `CONTEXT.md` (users, devices, brand, voice, glossary) and, if it exists, `docs/design-direction.md`.
- **[All] If there's no direction yet,** don't invent one silently. Ask the design questions in `SCAFFOLD.md` round 3, then propose two or three directions, each as one rendered screen or page plus three lines on its feel, and let the owner choose. Record the choice in `CONTEXT.md` (and in `docs/design-direction.md` for M and L, which grows into the design system's written rules).
- **[All] Design for the smallest real device first:** 360 px wide (or the users' actual phones from `CONTEXT.md`), then widen.
- **[All] Reuse before you create:** check the existing components and tokens; a new component or a one-off style is a choice to justify.

## 2. Avoid the generic AI look

AI-made interfaces look alike. Unless the brand asks for it, avoid:

- default component-library styling left unchanged;
- gradient blobs, glassmorphism and glow for decoration;
- three equal cards with an icon, a heading and two lines, as the answer to every section;
- everything centred; every section the same height and rhythm;
- emoji as icons; stock illustrations of people at laptops;
- vague copy ("Unlock your potential", "Seamless experience", "Elevate your workflow");
- placeholder text, fake logos, fake testimonials and invented numbers. Real content, or a clearly marked placeholder the owner must fill.

Instead: one clear idea per page or screen, a hierarchy that makes the main action obvious, the brand's own motifs and colours used with intent, and copy in the users' own words.

## 3. Tokens: the only source of style

- **[All] One theme file** holds every colour, font, size, space, radius, shadow, z-index and motion duration. Components use tokens, never raw hex values, pixel sizes or ad-hoc shadows.
- **[All] Colours by role,** not by name: surface, surface-raised, text, text-muted, primary (main action), on-primary, accent, border, focus, danger, warning, success, info. Brand colours map to roles in the theme.
- **[All] Type scale:** a fixed set of sizes (for example 12, 14, 16, 18, 20, 24, 30, 36, 48) with line heights; body at least 16 px on phones.
- **[All] Spacing scale** in steps of 4 (4, 8, 12, 16, 24, 32, 48, 64); layout spacing from the scale only.
- **[All] Radius, shadow and border** from a short set (for example three radii, two shadows).
- **[M] Dark mode** only when `CONTEXT.md` says so; then every colour role has both values and both are checked for contrast.

## 4. Layout and responsiveness

- **[All] Mobile first,** with a few breakpoints (for example 640, 1024, 1280). No horizontal scrolling at 360 px; nothing cut off at 200% text zoom.
- **[All] Touch targets** at least 44 × 44 px, with space between; the main action in the thumb's reach on phones (bottom of the screen for apps).
- **[All] Line length** 45 to 75 characters for reading text.
- **[All] Safe areas** respected on notched phones (`env(safe-area-inset-*)`).
- **[M] Navigation:** at most five top-level destinations on a phone; the current place always visible; Back works as expected (the browser's Back button too).
- **[M] Dense screens** (tables, lists) collapse into cards or stacked rows on phones rather than shrinking.

## 5. Typography

- **[All] At most two families** (one is often enough), self-hosted, subset, `font-display: swap`, with a fallback stack tuned to avoid layout shift.
- **[All] Hierarchy by size and weight,** not by colour alone; one H1 per page; headings in order.
- **[All] Numbers** that line up (tabular figures) in tables and money columns.

## 6. Colour and contrast

- **[All] WCAG AA:** 4.5:1 for text, 3:1 for large text, icons and the edges of inputs and controls. Check every pair in the theme, in every mode.
- **[All] Never colour alone** for meaning: pair it with an icon, text or pattern (errors, statuses, charts).
- **[All] Focus** visible on everything focusable, in a colour that passes 3:1 against its surroundings.

## 7. Every state, every time

Each screen and component is designed for all of these, not only the happy one:

| State | What it shows |
|---|---|
| Loading | A skeleton shaped like the content (not a spinner on a blank page), after a short delay so fast loads don't flash |
| Empty | What will appear here, and the one action that fills it |
| Error | What happened in plain words, what to do, and a retry; the user's input kept |
| Offline **[L]** | That the device is offline, what still works, and what's waiting to sync |
| Partial | Some data loaded, some failed: show what you have |
| Success | Confirmation of what happened and the obvious next step |
| Long content | Long names, many items, big numbers, other languages (30% longer text) |
| No permission **[M]** | Why it's unavailable and who can grant it, not a broken screen |

Buttons and controls: default, hover, focus, active, disabled (with the reason nearby), loading.

## 8. Forms

- **[All] Visible labels** above fields (placeholders are examples, not labels).
- **[All] The right keyboard and autofill:** `type`, `inputmode` and `autocomplete` on every field (email, tel, one-time-code, postal-code, current-password, new-password…).
- **[All] Validation** on blur and on submit, with the message next to the field saying how to fix it; the form scrolls to the first error; input is never cleared on error.
- **[All] Required and optional** marked clearly (mark whichever is rarer).
- **[M] Money, dates and phones** in the user's format, stored in the standard one (minor units, ISO dates, E.164).
- **[M] Long forms** split into steps or sections, with progress kept if the user leaves.
- **[All] One submission:** the button shows progress and can't fire twice.

## 9. Accessibility

- **[All] Semantic HTML first** (`button`, `a`, `label`, `nav`, `main`, lists, tables); ARIA only to fill a real gap.
- **[All] Keyboard:** everything reachable and usable in a sensible order; dialogs trap and return focus; Escape closes.
- **[All] Screen readers:** every control and image has a name; decorative images have empty `alt`; live regions announce results of actions that don't move focus.
- **[All] Motion:** respect `prefers-reduced-motion`; nothing flashes more than three times a second.
- **[M] Automated checks** (axe) in the end-to-end tests; a manual keyboard pass before release.

## 10. Motion

- **[All] Purposeful:** motion explains a change (where something came from or went), confirms an action, or draws the eye to one thing. Not decoration on every element.
- **[All] Quick:** 150 to 300 ms for most changes; ease-out to enter, ease-in to leave; animate `transform` and `opacity`, not layout.

## 11. Writing in the interface

- **[All] The glossary and voice in `CONTEXT.md` win.** Use the users' words; avoid the words it bans.
- **[All] Buttons are verbs** saying what happens ("Save Order", "Send Link"), not "OK" or "Submit". Use the capitalisation `CONTEXT.md` sets.
- **[All] Errors don't blame:** what went wrong, then how to fix it. No codes without words.
- **[All] Numbers, money, dates and times** through `Intl`, in the user's language and the business's time zone and currency.
- **[All] Short:** front-load the important words; one idea per sentence.
- **[M] Several languages:** no strings in code; room for longer text; no sentences built by gluing fragments (word order changes between languages); plurals with the library's plural rules.

## 12. Images, icons and media

- **[All] One icon set,** one stroke weight, sized from the scale, with text labels for anything not obvious.
- **[All] Images** compressed, in modern formats, with `width`, `height` and `alt`; hero images preloaded; others lazy.
- **[All] Real photos** of real users and work, with permission, beat stock and illustrations. Never use a photo of a real person without the owner confirming permission.
- **[All] Licences** for fonts, icons and images recorded (in `docs/system.md` or a notices file).

## 13. Websites (tier S, and the public pages of M and L)

- **[All] Speed:** Largest Contentful Paint under 2.5 s, layout shift under 0.1 and interaction under 200 ms on a mid-range phone on 4G.
- **[All] Search basics:** a unique title and description per page; one H1; Open Graph and social images; canonical URLs; `sitemap.xml` and `robots.txt`; structured data where it fits (organisation, product, FAQ, local business); `hreflang` for several languages; readable URLs.
- **[All] Trust basics:** contact details, the legal entity, privacy and terms pages, a working 404 page, a favicon and app icons.
- **[All] Analytics** that need no cookie banner where possible; a consent banner only when something needs consent, and it must really block those cookies until accepted.
- **[All] Forms** protected from spam (a honeypot or a privacy-friendly challenge) and rate-limited, sending a copy of what was sent to the owner.
- **[All] Calls to action** that match the one thing the site must do (`CONTEXT.md` section 4).

## 14. How to build and review a screen

1. Read the task, the spec and `CONTEXT.md`. Sketch the states (section 7) before code.
2. Build with tokens and existing components.
3. Look at it: take screenshots at 360 px and at 1280 px (and on the owner's real device when possible), in every state, and in each language if there are several.
4. Review against this checklist, and fix before showing:
   - [ ] One obvious main action; hierarchy clear in a squint test.
   - [ ] Tokens only; no raw colours or sizes.
   - [ ] Every state designed.
   - [ ] Contrast passes; focus visible; keyboard works; names for everything.
   - [ ] Touch targets at least 44 px; no horizontal scroll at 360 px; 200% zoom works.
   - [ ] Copy follows the glossary and voice; buttons are verbs; no placeholder text.
   - [ ] Page weight within the budget.
   - [ ] Nothing from section 2's generic look.
5. Show the owner the screenshots with two lines on what changed and any choice you made without direction.
