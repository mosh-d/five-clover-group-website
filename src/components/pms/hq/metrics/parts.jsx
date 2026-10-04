"use client";

import { useState } from "react";
import { IoArrowUp, IoArrowDown, IoRemove, IoAlertCircle, IoCloseCircle, IoTrendingDown } from "react-icons/io5";
import { card, field, table } from "@/components/pms/ui";
import InfoTip, { FloatingTip, tipFor } from "@/components/pms/InfoTip";
import { Tip } from "@/components/pms/Tip";
import { tipText } from "@/lib/pms/tips";
import { DASH } from "./format";

// Pieces the Metrics page's views are built from: headline tiles, the
// branch table (first column pinned, sortable, an All Branches total, an
// in-cell bar for the figure being compared) and a day-by-day grid shaded
// by value - all on the PMS's own recipes (components/pms/ui.js). One colour
// throughout - the brand's emphasis - because every chart here compares one
// measure; the numbers are always printed beside the colour, so nothing is
// read from colour alone.

const muted = "text-(--text-color)/68";

// `tip`: an entry in lib/pms/tips.js, shown as an (i) after the title.
export function SectionTitle({ children, sub, tip }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-2xl font-semibold text-(--text-color)">
        {children}
        {tip && <Tip id={tip} />}
      </h3>
      {sub && <p className={`text-xl ${muted}`}>{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- tiles

const DELTA_CLASS = { good: "text-green-800", bad: "text-red-700", neutral: muted };

// `delta`: { direction: up|down|flat, text } from format.change(); `upIsGood`
// says which way is better (true, false, or null when neither is).
// `tip`: an entry in lib/pms/tips.js, shown as an (i) after the label.
export function StatTile({ label, value, sub, delta, upIsGood = true, vs, tip }) {
  const tone =
    !delta || delta.direction === "flat" || upIsGood === null ? "neutral" : (delta.direction === "up") === upIsGood ? "good" : "bad";
  const Icon = !delta ? null : delta.direction === "up" ? IoArrowUp : delta.direction === "down" ? IoArrowDown : IoRemove;
  return (
    <div className={`${card.surface} p-6 flex flex-col gap-2 min-w-0`}>
      <p className={`text-xl font-semibold ${muted}`}>
        {label}
        {tip && <Tip id={tip} />}
      </p>
      <p className="text-4xl font-semibold leading-tight break-words text-(--text-color)">{value}</p>
      {delta && (
        <p className={`text-lg font-semibold inline-flex items-center gap-1.5 ${DELTA_CLASS[tone]}`}>
          <Icon aria-hidden="true" />
          <span>
            {delta.text}
            {vs && <span className={`font-normal ${muted}`}> vs {vs}</span>}
          </span>
        </p>
      )}
      {sub && <p className={`text-lg ${muted}`}>{sub}</p>}
    </div>
  );
}

export function StatRow({ children }) {
  // Three across where they fit, else one under another - never two and an
  // orphan. Between md and lg the sidebar takes the room three would need.
  return <div className="w-full grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-4">{children}</div>;
}

// ------------------------------------------------------------ the table

// The figure a column compares, drawn as a thin bar under its number. Bars
// grow from one baseline, square there and rounded at the data end.
function Bar({ fraction }) {
  if (!(fraction > 0)) return null;
  return (
    <div className="mt-1.5 h-1.5 w-full min-w-[6rem]" aria-hidden="true">
      <div className="h-full rounded-r-[4px] bg-(--emphasis)" style={{ width: `${Math.round(Math.min(100, fraction * 100) * 100) / 100}%` }} />
    </div>
  );
}

const compareValues = (a, b) => {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
  if (b === null || b === undefined) return -1;
  return typeof a === "string" ? a.localeCompare(b) : a - b;
};

/**
 * rows: the data; first: the pinned name column { label, render(row), value(row) };
 * columns: [{ key, label, hint, tip, value(row) -> number|string|null, render(row), sub(row), bar, barMax, align }];
 *   `hint` puts an (i) beside the heading that says it in full ("OOO" -> Out of Order);
 *   `tip` names an entry in lib/pms/tips.js for the same (i) when there is no hint;
 * tipPrefix: else a column's tip is "<tipPrefix>.<its key>" ("<tipPrefix>.__first" for the pinned one);
 *   a bar is drawn against `barMax` when set (100 for a percentage, so 3%
 *   never looks full), else against the column's largest value;
 * total: the All Branches row (rendered with the same columns), or null;
 * defaultSort: { key, dir }.
 */
export function DataTable({ rows, first, columns, total, totalLabel = "All branches", rowKey, defaultSort, empty = "Nothing to show for these dates.", tipPrefix }) {
  const tipOf = (col, key) => col.hint || tipText(col.tip || (tipPrefix && `${tipPrefix}.${key}`));
  const [sort, setSort] = useState(defaultSort || null);
  const sortCol = sort && (sort.key === "__first" ? { value: first.value || ((r) => String(first.render(r))) } : columns.find((c) => c.key === sort.key));
  const sorted = sortCol
    ? [...rows].sort((a, b) => {
        const va = sortCol.value(a);
        const vb = sortCol.value(b);
        // Blanks last whichever way it is sorted.
        if (va === null || va === undefined || vb === null || vb === undefined) return compareValues(va, vb);
        return sort.dir === "asc" ? compareValues(va, vb) : compareValues(vb, va);
      })
    : rows;
  const maxOf = (col) => Math.max(0, ...rows.map((r) => Number(col.value(r)) || 0));
  const maxima = Object.fromEntries(columns.filter((c) => c.bar).map((c) => [c.key, c.barMax ?? maxOf(c)]));
  const toggle = (key) =>
    setSort((s) => (s && s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "__first" ? "asc" : "desc" }));

  const head = (key, label, align, hint, extra = "") => {
    const active = sort?.key === key;
    return (
      <th
        key={key}
        className={`${table.th} ${align === "right" ? "text-right!" : ""} ${extra}`}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className={`inline-flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""}`}>
          <button type="button" onClick={() => toggle(key)} className="inline-flex items-center gap-1 uppercase tracking-wide cursor-pointer">
            {label}
            {active ? sort.dir === "asc" ? <IoArrowUp aria-hidden="true" /> : <IoArrowDown aria-hidden="true" /> : null}
          </button>
          {/* Beside the sort button, not in it: one control inside another
              is neither clickable nor readable to a screen reader. */}
          {hint && <InfoTip text={hint} />}
        </span>
      </th>
    );
  };

  const cell = (col, row, isTotal) => {
    const v = col.value(row);
    return (
      <td key={col.key} className={`${table.td} ${col.align === "right" ? "text-right!" : ""}`}>
        <div className={col.align === "right" ? "flex flex-col items-end" : ""}>
          <span>{col.render ? col.render(row) : v ?? DASH}</span>
          {col.sub && <span className={`text-lg ${muted}`}>{col.sub(row)}</span>}
          {col.bar && !isTotal && <Bar fraction={maxima[col.key] > 0 ? (Number(v) || 0) / maxima[col.key] : 0} />}
        </div>
      </td>
    );
  };

  return (
    <div className={table.card}>
      <div className={table.scroll}>
        <table className={table.el}>
          <thead>
            <tr className={table.headRow}>
              {head("__first", first.label, "left", tipOf(first, "__first"), table.stickyTh)}
              {columns.map((c) => head(c.key, c.label, c.align, tipOf(c, c.key)))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td className={table.empty} colSpan={columns.length + 1}>{empty}</td>
              </tr>
            )}
            {sorted.map((row, i) => (
              <tr key={rowKey ? rowKey(row) : i} className={table.row}>
                <td className={`${table.td} ${table.stickyTd} font-semibold`}>{first.render(row)}</td>
                {columns.map((c) => cell(c, row, false))}
              </tr>
            ))}
            {total && sorted.length > 0 && (
              <tr className={`${table.row} border-t-2 font-semibold`}>
                <td className={`${table.td} ${table.stickyTd}`}>{totalLabel}</td>
                {columns.map((c) => cell(c, total, true))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- the grid

/**
 * A day-by-day (or month-by-month) grid, one row per branch, each cell
 * shaded from the card colour (low) to the brand colour (high), with its
 * value printed in it. Hover or focus a cell for what it is.
 *  rows: [{ key, label, cells: { [columnKey]: { value, text, tip } } }]
 *  columns: [{ key, label, sub }]
 */
export function HeatGrid({ rows, columns, max, legendLow, legendHigh, caption }) {
  const [tip, setTip] = useState(null);
  const show = (e, text) => setTip(tipFor(e.currentTarget, text));
  const fill = (value) => {
    if (value === null || value === undefined) return undefined;
    if (value < 0) return "color-mix(in srgb, var(--text-color) 10%, var(--card))";
    if (value === 0 || !(max > 0)) return undefined;
    const p = Math.round(10 + 90 * Math.min(1, value / max));
    return `color-mix(in srgb, var(--emphasis) ${p}%, var(--card))`;
  };
  return (
    <figure className="w-full flex flex-col gap-3 m-0">
      <div className={table.card}>
        <div className={table.scroll}>
          <table className="border-collapse text-lg">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className={table.headRow}>
                <th className={`${table.th} ${table.stickyTh}`}>Branch</th>
                {columns.map((c) => (
                  <th key={c.key} className="px-1 py-3 text-center font-semibold whitespace-nowrap min-w-[4.6rem] text-(--text-color)/76">
                    <span className="block">{c.label}</span>
                    {c.sub && <span className={`block font-normal ${muted}`}>{c.sub}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="group border-b border-(--accent-2) last:border-b-0">
                  <td className={`px-6 py-3 font-semibold whitespace-nowrap text-(--text-color) ${table.stickyTd}`}>{row.label}</td>
                  {columns.map((c) => {
                    const cellData = row.cells[c.key] || {};
                    return (
                      <td
                        key={c.key}
                        tabIndex={0}
                        aria-label={cellData.tip}
                        onPointerEnter={(e) => show(e, cellData.tip)}
                        onPointerLeave={() => setTip(null)}
                        onFocus={(e) => show(e, cellData.tip)}
                        onBlur={() => setTip(null)}
                        className="px-1 py-3 text-center whitespace-nowrap border-l-2 border-(--card) outline-none focus-visible:ring-2 focus-visible:ring-(--emphasis) hover:brightness-95"
                        style={{ background: fill(cellData.value) }}
                      >
                        <span className={cellData.value ? "text-(--text-color)" : muted}>{cellData.text ?? DASH}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className={`flex items-center gap-3 text-lg ${muted}`}>
        <span>{legendLow}</span>
        <span
          className="h-3 w-40 rounded-sm"
          aria-hidden="true"
          style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--emphasis) 10%, var(--card)), var(--emphasis))" }}
        />
        <span>{legendHigh}</span>
      </figcaption>
      <FloatingTip tip={tip} />
    </figure>
  );
}

// ------------------------------------------------------------- the rest

// Stock states carry an icon and a word, never colour alone.
const STATE = {
  below_zero: { label: "Below zero", Icon: IoAlertCircle, className: "bg-red-50 text-red-800", iconColor: "#d03b3b" },
  out: { label: "Out of stock", Icon: IoCloseCircle, className: "bg-orange-50 text-orange-900", iconColor: "#c2410c" },
  low: { label: "Running low", Icon: IoTrendingDown, className: "bg-amber-50 text-amber-900", iconColor: "#b45309" },
};

export function StateChip({ state }) {
  const s = STATE[state];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-lg font-semibold ${s.className}`}>
      <s.Icon aria-hidden="true" style={{ color: s.iconColor }} />
      {s.label}
    </span>
  );
}

// Something worth knowing about the figures - in the brand's colour, as a
// remark, not a warning.
export function Remark({ children }) {
  return (
    <p className="w-full text-xl rounded-lg border border-(--emphasis) bg-[color-mix(in_srgb,var(--emphasis)_8%,var(--card))] px-4 py-3 text-(--text-color)">
      {children}
    </p>
  );
}

export function HowCounted({ children }) {
  return (
    <p className={`text-lg ${muted}`}>
      <span className="font-semibold">How this is counted: </span>
      {children}
    </p>
  );
}

// A choice for the lists that take one (a branch; food or drinks).
export function Choice({ label, value, options, onChange, id, tip }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={field.label}>
        {label}
        {tip && <Tip id={tip} />}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={field.select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
