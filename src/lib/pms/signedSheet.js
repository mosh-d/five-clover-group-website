// A report under sign-off, with the accountant's corrections laid over it
// (owner, 2026-11-26; backend phase-104). The accountant's review and the
// auditor's view both read it through here, so they always agree.
//
// `sheet` is the report as it stood when the review began; `corrections`:
//   note   { text, section? }                 - something is wrong
//   edit   { section, row|total, col?, value } - a cell (or a total) changed
//   add    { section, cells }                  - a row added
//   delete { section, row }                    - a row removed
// each with by_name and at. Rows are a number (the report's own) or
// "added:<id>" (one the accountant added). Nothing here changes a ledger.

const fmtWhen = (at) => {
  if (!at) return "";
  const d = new Date(at);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { timeZone: "Africa/Lagos", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

/** "Corrected by the accountant (ada, Nov 26, 3:40 PM)". */
export const byLine = (verb, c) => `${verb} by the accountant${c?.by_name ? ` (${c.by_name}${c.at ? `, ${fmtWhen(c.at)}` : ""})` : ""}`;

/**
 * The view: each section's rows with their marks - an edited cell keeps
 * `was` (the figure before) and `edit` (the correction); an added row
 * `added`; a removed one `removed` (it stays, struck through) - and its
 * totals likewise; plus every note, the report's and each section's.
 */
export function applyCorrections(sheet, corrections = []) {
  const list = Array.isArray(corrections) ? corrections : [];
  const sections = (sheet?.sections || []).map((s, si) => {
    const own = list.filter((c) => c.section === si);
    const rowKey = (i) => i;
    const base = (s.rows || []).map((r, i) => ({ key: rowKey(i), strong: r.strong, cells: (r.cells || []).map((c) => ({ ...c })) }));
    const added = own
      .filter((c) => c.type === "add")
      .map((c) => ({ key: `added:${c.id}`, added: c, cells: (s.columns || []).map((col, ci) => ({ text: c.cells?.[ci] ?? "", align: col.align })) }));
    const rows = [...base, ...added];
    for (const c of own) {
      const row = rows.find((r) => r.key === c.row);
      if (c.type === "edit" && c.target !== "total" && row && row.cells[c.col]) {
        const cell = row.cells[c.col];
        if (!("was" in cell)) cell.was = cell.text;
        cell.text = c.value;
        cell.edit = c;
      }
      if (c.type === "delete" && row) row.removed = c;
    }
    const totals = (s.totals || []).map((t) => ({ ...t }));
    for (const c of own) {
      if (c.type === "edit" && c.target === "total" && totals[c.total]) {
        const t = totals[c.total];
        if (!("was" in t)) t.was = t.value;
        t.value = c.value;
        t.edit = c;
      }
    }
    return { heading: s.heading, columns: s.columns || [], rows, totals, note: s.note || "", figures: s.figures || [], notes: own.filter((c) => c.type === "note") };
  });
  return {
    ...sheet,
    sections,
    notes: list.filter((c) => c.type === "note" && (c.section === null || c.section === undefined)),
    count: { notes: list.filter((c) => c.type === "note").length, corrections: list.filter((c) => c.type !== "note").length },
  };
}

/**
 * The view as a printable sheet (lib/pms/reportSheet.js): a corrected figure
 * reads "new (was old)", an added row starts "[Added]", a removed one
 * "[Removed]", and the accountant's notes and every correction are listed
 * at the end, with who made them and when.
 */
export function printableSheet(view, signedLine = "") {
  const sections = view.sections.map((s) => ({
    heading: s.heading,
    columns: s.columns,
    totals: s.totals.map((t) => ({ label: t.label, value: "was" in t ? `${t.value} (was ${t.was})` : t.value, note: t.edit ? byLine("Corrected", t.edit) : t.note })),
    note: [s.note, ...s.notes.map((n) => `Accountant's note: ${n.text} - ${byLine("Noted", n)}`)].filter(Boolean).join("\n"),
    figures: s.figures,
    rows: s.rows.map((r) => ({
      strong: r.strong,
      cells: r.cells.map((c, ci) => {
        let text = "was" in c ? `${c.text} (was ${c.was})` : c.text;
        if (ci === 0 && r.added) text = `[Added] ${text}`;
        if (ci === 0 && r.removed) text = `[Removed] ${text}`;
        return { text, align: c.align || "left", span: 1 };
      }),
    })),
  }));
  const log = [];
  for (const s of view.sections) {
    for (const r of s.rows) {
      if (r.added) log.push(`${s.heading}: a row added - ${byLine("Added", r.added)}${r.added.reason ? `. Why: ${r.added.reason}` : ""}`);
      if (r.removed) log.push(`${s.heading}: a row removed - ${byLine("Removed", r.removed)}${r.removed.reason ? `. Why: ${r.removed.reason}` : ""}`);
      for (const [ci, c] of r.cells.entries()) {
        if (c.edit) log.push(`${s.heading}, ${s.columns[ci]?.label || "a cell"}: ${c.was} corrected to ${c.text} - ${byLine("Corrected", c.edit)}${c.edit.reason ? `. Why: ${c.edit.reason}` : ""}`);
      }
    }
    for (const t of s.totals) if (t.edit) log.push(`${s.heading}, ${t.label}: ${t.was} corrected to ${t.value} - ${byLine("Corrected", t.edit)}${t.edit.reason ? `. Why: ${t.edit.reason}` : ""}`);
  }
  const notes = view.notes.map((n) => `${n.text} - ${byLine("Noted", n)}`);
  if (notes.length || log.length || signedLine) {
    sections.push({
      heading: "Accountant's Sign-Off",
      columns: [],
      rows: [],
      totals: [],
      figures: [],
      note: [signedLine, ...notes.map((n) => `Note: ${n}`), ...log].filter(Boolean).join("\n"),
    });
  }
  return { ...view, sections };
}
