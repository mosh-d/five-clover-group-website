// The branded report sheet (owner, 2026-11-12: "a nicely styled report
// export ... with our logos and nice looking tables ... for all reports").
//
// Two halves, both plain functions so they can be tested on their own:
//   readTables / readFigures / readTotals - read what a report shows on the
//     screen, from its own rendered tables, so the sheet can never disagree
//     with the page (the same cells, the same order, the same totals);
//   buildReportSheet - lays that out as a printable A4 document: the branch's
//     logo on its brand's dark band, the report's name, place and dates, the
//     key figures, the tables, and the group's three marks at the foot.
// The document is printed through lib/pms/print.js, where "Save as PDF" in
// the print window makes the file.

const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Text as it reads on the screen: innerText keeps a cell's line breaks (a
// figure with a note under it) and leaves out what is hidden; the (i) tips are
// icons, so they bring no text. Runs of spaces collapse, line breaks stay.
const textOf = (el) =>
  String(el?.innerText ?? el?.textContent ?? "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

// A heading's own words, without a link in it (the Flash Report's "View log"
// under each column title).
const headText = (th) => {
  const links = new Set([...th.querySelectorAll("a[href]")].map(textOf).filter(Boolean));
  return textOf(th)
    .split("\n")
    .filter((line) => !links.has(line))
    .join("\n");
};

// Columns that are controls, not data: a row's buttons and links.
const SKIPPED_HEADINGS = /^(actions?|)$/i;

const alignOf = (cell) => {
  const a = (typeof window !== "undefined" && window.getComputedStyle(cell).textAlign) || "";
  return a === "right" || a === "end" ? "right" : a === "center" ? "center" : "left";
};

// Red text on the screen (a refund, a shortfall) stays red on the sheet.
const isRed = (cell) => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(window.getComputedStyle(cell).color || "");
  return Boolean(m) && Number(m[1]) > 150 && Number(m[2]) < 110 && Number(m[3]) < 110;
};

const isBold = (el) => Number.parseInt(window.getComputedStyle(el).fontWeight, 10) >= 600;

// The heading a table sits under, inside `within`: the nearest h2-h4 before
// it, walking out one wrapper at a time (By Staff's three tables each sit
// under their own h3).
function headingFor(tableEl, within, depth = Infinity) {
  let node = tableEl;
  for (let level = 0; node && node !== within && level < depth; level += 1) {
    let prev = node.previousElementSibling;
    while (prev) {
      const h = prev.matches("h2, h3, h4") ? prev : prev.querySelector("h2, h3, h4");
      if (h) return textOf(h);
      prev = prev.previousElementSibling;
    }
    node = node.parentElement;
  }
  return "";
}

/** The heading just above an element on the page (a few wrappers out at most). */
export const headingNear = (el) => (el ? headingFor(el, document.body, 4) : "");

/** One rendered <table> as { columns, rows }, without its control columns. */
export function readTable(tableEl) {
  const headRows = [...tableEl.querySelectorAll(":scope > thead > tr")];
  const headRow = headRows[headRows.length - 1];
  const columns = [];
  const skipped = new Set();
  let index = 0;
  for (const th of headRow ? [...headRow.cells] : []) {
    const label = headText(th);
    const span = th.colSpan || 1;
    for (let i = 0; i < span; i += 1) {
      if (SKIPPED_HEADINGS.test(label)) skipped.add(index + i);
      else if (i === 0) columns.push({ label, align: alignOf(th), span });
    }
    index += span;
  }
  const readRow = (tr, foot) => {
    let at = 0;
    const cells = [];
    for (const td of tr.cells) {
      const span = td.colSpan || 1;
      const kept = Array.from({ length: span }, (_, i) => at + i).filter((i) => !skipped.has(i)).length;
      if (kept > 0) cells.push({ text: textOf(td), align: alignOf(td), span: kept, red: isRed(td) });
      at += span;
    }
    return { cells, strong: foot || isBold(tr) };
  };
  const rows = [...tableEl.querySelectorAll(":scope > tbody > tr")].map((tr) => readRow(tr, false));
  const foot = [...tableEl.querySelectorAll(":scope > tfoot > tr")].map((tr) => readRow(tr, true));
  // A table paged by the server shows one page; its card names the loader
  // that fetches every row instead (TableCard's report.load).
  const loadId = tableEl.closest("[data-report-load]")?.getAttribute("data-report-load") || null;
  return { columns, rows: [...rows, ...foot].filter((r) => r.cells.length > 0), loadId };
}

/**
 * Plain data as a sheet table: { columns: [label], rows: [[value]], right:
 * [labels of right-aligned columns] } - for a loader's rows.
 */
export function dataTable({ columns, rows, right = [] }) {
  const align = (label) => (right.includes(label) ? "right" : "left");
  return {
    columns: columns.map((label) => ({ label, align: align(label), span: 1 })),
    rows: rows.map((r) => ({ strong: false, cells: r.map((v, i) => ({ text: String(v ?? "").trim() || "-", align: align(columns[i]), span: 1, red: false })) })),
  };
}

const outerTables = (el) => [...el.querySelectorAll("table")].filter((t) => !t.parentElement.closest("table"));

// A ReportSection (data-report-section): its tables, each under its own
// heading or the section's title, with the section's totals after the last;
// one with no table (Room Status, Notes, Grand Total) brings its text instead.
function readSection(el) {
  const title = el.getAttribute("data-report-title") || "";
  const totals = readTotals(el);
  const figures = readFigures(el, true);
  // Notes beside a table (the Accommodation report's guest notes) mark
  // themselves data-report-note.
  const notes = [...el.querySelectorAll("[data-report-note]")].map(textOf).filter(Boolean).join("\n");
  const tables = outerTables(el).map((t) => {
    const sub = headingFor(t, el);
    return { heading: sub && title && sub !== title ? `${title} - ${sub}` : sub || title, ...readTable(t), totals: [], note: "", figures: [] };
  });
  if (tables.length) {
    Object.assign(tables[tables.length - 1], { totals, note: notes });
    tables[0].figures = figures;
    return tables;
  }
  const body = el.querySelector("[data-report-body]");
  const note = totals.length || figures.length ? notes : textOf(body);
  return [{ heading: title, columns: [], rows: [], totals, note, figures }];
}

/**
 * Everything to put on the sheet from `root`, in the page's order: each
 * ReportSection in it, and each table that isn't in one.
 */
export function readSections(root) {
  if (root.matches("[data-report-section]")) return readSection(root);
  return [...root.querySelectorAll("[data-report-section], table")]
    .filter((n) => !n.parentElement.closest("[data-report-section]") && !(n.tagName === "TABLE" && n.parentElement.closest("table")))
    .flatMap((n) => (n.tagName === "TABLE" ? [{ heading: headingFor(n, root), ...readTable(n), totals: [], note: "", figures: [] }] : readSection(n)));
}

/** The figures a report leads with - SummaryCard / StatTile mark theirs. */
// `inSections`: false leaves out figures that belong to a section of their
// own (the Bar Stock report's Daily Totals), which readSection takes.
export function readFigures(root, inSections = false) {
  if (!root) return [];
  return [...root.querySelectorAll("[data-report-figure]")]
    .filter((el) => inSections || !el.closest("[data-report-section]"))
    .map((el) => ({
    label: textOf(el.querySelector('[data-figure-part="label"]')),
    value: textOf(el.querySelector('[data-figure-part="value"]')),
    sub: textOf(el.querySelector('[data-figure-part="sub"]')),
  }));
}

/** The totals under a section's table (TotalLine marks its parts). */
export function readTotals(root) {
  if (!root) return [];
  return [...root.querySelectorAll("[data-report-total]")].map((el) => ({
    label: textOf(el.querySelector('[data-total-part="label"]')),
    value: textOf(el.querySelector('[data-total-part="value"]')),
    note: textOf(el.querySelector('[data-total-part="note"]')),
  }));
}

// ------------------------------------------------------------- the sheet

const lines = (text) => escapeHtml(text).replace(/\n/g, "<br>");

function tableHtml(section) {
  const head = section.columns
    .map((c) => `<th class="a-${c.align}"${c.span > 1 ? ` colspan="${c.span}"` : ""}>${lines(c.label)}</th>`)
    .join("");
  const body = section.rows
    .map((r) =>
      // One cell across the whole table: the table's "nothing here" line.
      section.rows.length === 1 && r.cells.length === 1 && r.cells[0].span > 1
        ? `<tr><td class="none" colspan="${r.cells[0].span}">${lines(r.cells[0].text)}</td></tr>`
        : r)
    .map(
      (r) =>
        typeof r === "string" ? r :
        `<tr${r.strong ? ' class="strong"' : ""}>${r.cells
          // A short value (a date, an amount) stays on one line; long text wraps.
          .map((c) => `<td class="a-${c.align}${c.red ? " red" : ""}${c.text.length <= 24 && !c.text.includes("\n") ? " nw" : ""}"${c.span > 1 ? ` colspan="${c.span}"` : ""}>${lines(c.text)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/**
 * The whole document. `brand` is { name, hue, emphasis } (theme/brands.js);
 * `logo` and `marks` are absolute image URLs.
 */
export function buildReportSheet({ brand, logo, marks = [], place, report, title, subtitle, period, preparedBy, generatedAt, figures = [], sections = [] }) {
  const hue = brand.hue;
  const widest = Math.max(0, ...sections.map((s) => s.columns.length));
  const landscape = widest > 6;
  const dense = widest > 9;
  const docTitle = [report, title !== report ? title : null, place, period].filter(Boolean).join(" - ");
  const many = sections.length > 1;

  const figuresHtml = (list) =>
    list.length
      ? `<div class="figures">${list
          .map((f) => `<div class="figure"><div class="f-label">${lines(f.label)}</div><div class="f-value">${lines(f.value)}</div>${f.sub ? `<div class="f-sub">${lines(f.sub)}</div>` : ""}</div>`)
          .join("")}</div>`
      : "";
  const totalsHtml = (totals) =>
    totals.length
      ? `<div class="totals">${totals
          .map((t) => `<div class="total"><span class="t-label">${lines(t.label)}</span><span class="t-value">${lines(t.value)}</span>${t.note ? `<span class="t-note">${lines(t.note)}</span>` : ""}</div>`)
          .join("")}</div>`
      : "";
  const sectionsHtml = sections
    .map((s) => {
      const figs = figuresHtml(s.figures || []);
      const table = s.rows.length ? tableHtml(s) : "";
      const note = s.note ? `<p class="note">${lines(s.note)}</p>` : "";
      const empty = !figs && !table && !note && !s.totals?.length ? '<p class="empty">Nothing to show for this period.</p>' : "";
      const heading = many || (s.heading && s.heading !== title) ? `<h2>${lines(s.heading || title)}</h2>` : "";
      return `<section>${heading}${figs}${table}${note}${empty}${totalsHtml(s.totals || [])}</section>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title><style>
@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 14mm 12mm 16mm;
  @bottom-left { content: "${escapeHtml(place).replace(/"/g, "")} \\00B7  ${escapeHtml(report).replace(/"/g, "")}"; font: 7.5pt Helvetica, Arial, sans-serif; color: #8a8178; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 7.5pt Helvetica, Arial, sans-serif; color: #8a8178; } }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; background: #fff; }
body { font: ${dense ? "8pt" : "9pt"}/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; color: hsl(${hue}, 13%, 18%); }
.band { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 20px; border-radius: 10px;
  background: hsl(${hue}, 13%, 18%); color: #fff; border-bottom: 4px solid ${brand.emphasis}; }
.band img { height: 62px; width: auto; display: block; }
.band .who { text-align: right; }
.kicker { font-size: 7.5pt; letter-spacing: .16em; text-transform: uppercase; color: ${brand.emphasis}; font-weight: 700; }
h1 { margin: 3px 0 2px; font-size: 17pt; line-height: 1.15; font-weight: 700; }
.place { font-size: 9.5pt; color: rgba(255,255,255,.78); }
.meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 18px; margin: 10px 2px 14px; font-size: 8pt; color: hsl(${hue}, 10%, 42%); }
.meta b { color: hsl(${hue}, 13%, 18%); font-weight: 600; }
.subtitle { margin: 0 2px 12px; font-size: 9pt; color: hsl(${hue}, 10%, 38%); }
.figures { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin: 0 0 16px; }
.figure { border: 1px solid hsl(${hue}, 26%, 86%); border-left: 3px solid ${brand.emphasis}; border-radius: 6px; padding: 8px 10px; background: hsl(${hue}, 38%, 98%); break-inside: avoid; }
.f-label { font-size: 7pt; text-transform: uppercase; letter-spacing: .08em; color: hsl(${hue}, 10%, 42%); font-weight: 700; }
.f-value { font-size: 13pt; font-weight: 700; margin-top: 2px; color: hsl(0, 0%, 8%); }
.f-sub { font-size: 7.5pt; color: hsl(${hue}, 10%, 46%); margin-top: 1px; }
section { margin: 0 0 16px; }
h2 { font-size: 11pt; margin: 0 0 6px; padding-left: 8px; border-left: 3px solid ${brand.emphasis}; break-after: avoid; }
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
thead { display: table-header-group; }
th { background: hsl(${hue}, 38%, 93%); color: hsl(${hue}, 13%, 24%); font-size: ${dense ? "6.5pt" : "7pt"}; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
  padding: 7px 8px; border-bottom: 1.5px solid ${brand.emphasis}; text-align: left; vertical-align: bottom; }
td { padding: ${dense ? "4px 6px" : "5.5px 8px"}; border-bottom: 1px solid hsl(${hue}, 26%, 89%); vertical-align: top; }
tbody tr:nth-child(even) td { background: hsl(${hue}, 38%, 98%); }
tr { break-inside: avoid; }
td:first-child { font-weight: 600; color: hsl(0, 0%, 8%); }
tr.strong td { font-weight: 700; background: hsl(${hue}, 38%, 95%) !important; border-top: 1.5px solid hsl(${hue}, 13%, 30%); }
.a-right { text-align: right; } .a-center { text-align: center; } .a-left { text-align: left; }
.red { color: #b42318; }
.nw { white-space: nowrap; }
td.none { font-weight: 400 !important; color: hsl(${hue}, 10%, 46%); text-align: center; padding: 12px 8px; }
td { overflow-wrap: anywhere; }
.empty { margin: 0; padding: 12px; border: 1px dashed hsl(${hue}, 26%, 82%); border-radius: 6px; color: hsl(${hue}, 10%, 46%); }
.note { margin: 8px 0 0; padding: 10px 12px; border: 1px solid hsl(${hue}, 26%, 88%); border-radius: 6px; line-height: 1.6; }
.totals { display: flex; flex-direction: column; gap: 4px; margin: 6px 0 0; padding: 8px 10px; border-radius: 6px; background: hsl(${hue}, 38%, 96%); break-inside: avoid; }
.total { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
.t-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; color: hsl(${hue}, 10%, 38%); }
.t-value { font-size: 11pt; font-weight: 700; color: hsl(0, 0%, 8%); }
.t-note { flex-basis: 100%; font-size: 7.5pt; color: hsl(${hue}, 10%, 46%); }
.foot { margin-top: 22px; padding-top: 10px; border-top: 1px solid hsl(${hue}, 26%, 86%); display: flex; align-items: center; justify-content: space-between; gap: 16px; break-inside: avoid; }
.marks { display: flex; align-items: center; gap: 18px; }
.marks img { height: 26px; width: auto; opacity: .55; filter: grayscale(1); }
.foot p { margin: 0; font-size: 7.5pt; color: hsl(${hue}, 10%, 46%); text-align: right; }
</style></head><body>
<header class="band">
  ${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(brand.name)}">` : `<strong>${escapeHtml(brand.name)}</strong>`}
  <div class="who"><div class="kicker">${escapeHtml(title === report ? "Full Report" : report)}</div><h1>${lines(title)}</h1><div class="place">${escapeHtml(place)}${period ? ` &middot; ${escapeHtml(period)}` : ""}</div></div>
</header>
<div class="meta"><span>Prepared by <b>${escapeHtml(preparedBy || "PMS")}</b></span><span>Generated <b>${escapeHtml(generatedAt)}</b> (Lagos time)</span></div>
${subtitle ? `<p class="subtitle">${lines(subtitle)}</p>` : ""}
${figuresHtml(figures)}
${sectionsHtml}
<footer class="foot">
  <div class="marks">${marks.map((m) => `<img src="${escapeHtml(m.src)}" alt="${escapeHtml(m.name)}">`).join("")}</div>
  <p>Five Clover Hotels Group &middot; For internal use</p>
</footer>
</body></html>`;
}

/** "Nov 1, 2026 - Nov 12, 2026", or the one date when from and to agree. */
export function periodLabel(from, to, format) {
  if (!from && !to) return "";
  if (!to || from === to) return format(from || to);
  if (!from) return format(to);
  return `${format(from)} - ${format(to)}`;
}
