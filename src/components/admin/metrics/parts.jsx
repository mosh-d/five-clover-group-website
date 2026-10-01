"use client";

import { useState } from "react";
import { IoArrowUp, IoArrowDown, IoRemove, IoAlertCircle, IoCloseCircle, IoTrendingDown } from "react-icons/io5";
import {
  textColorStyle,
  mutedTextStyle,
  bodyText,
  tableCardClass,
  tableCardStyle,
  tableScrollClass,
  tableClass,
  tableHeadRowClass,
  tableHeadRowStyle,
  tableThClass,
  tableRowStyle,
  tableTdClass,
  cardBg,
} from "@/components/admin/adminStyles";
import { DASH } from "./format";

// Pieces the Metrics page's views are built from: headline tiles, the
// branch table (branch column pinned, sortable, an All Branches total, an
// in-cell bar for the figure being compared) and a day-by-day grid shaded
// by value. One colour throughout - the brand emphasis - because every
// chart here compares one measure; the numbers are always printed beside
// the colour, so nothing is read from colour alone.

export function SectionTitle({ children, sub }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-2xl font-semibold" style={textColorStyle}>{children}</h3>
      {sub && <p className={bodyText} style={mutedTextStyle}>{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- tiles

const DELTA_STYLE = {
  good: { color: "#006300" },
  bad: { color: "#b42318" },
  neutral: mutedTextStyle,
};

// `delta`: { direction: up|down|flat, text } from format.change(); `upIsGood`
// says which way is better (true, false, or null when neither is).
export function StatTile({ label, value, sub, delta, upIsGood = true, vs }) {
  const tone =
    !delta || delta.direction === "flat" || upIsGood === null ? "neutral" : (delta.direction === "up") === upIsGood ? "good" : "bad";
  const Icon = !delta ? null : delta.direction === "up" ? IoArrowUp : delta.direction === "down" ? IoArrowDown : IoRemove;
  return (
    <div className="rounded-xl border p-6 flex flex-col gap-2 min-w-0" style={{ backgroundColor: cardBg, borderColor: "var(--accent-2)" }}>
      <p className="text-xl font-semibold" style={mutedTextStyle}>{label}</p>
      <p className="text-4xl font-semibold leading-tight break-words" style={textColorStyle}>{value}</p>
      {delta && (
        <p className="text-lg font-semibold inline-flex items-center gap-1.5" style={DELTA_STYLE[tone]}>
          <Icon aria-hidden="true" />
          <span>
            {delta.text}
            {vs && <span className="font-normal" style={mutedTextStyle}> vs {vs}</span>}
          </span>
        </p>
      )}
      {sub && <p className="text-lg" style={mutedTextStyle}>{sub}</p>}
    </div>
  );
}

export function StatRow({ children }) {
  // Three across where they fit, else one under another - never two and an
  // orphan. Between md and lg the sidebar takes the room three would need.
  return <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-4">{children}</div>;
}

// ------------------------------------------------------------ the table

// The figure a column compares, drawn as a thin bar under its number. Bars
// grow from one baseline, square there and rounded at the data end.
function Bar({ fraction }) {
  if (!(fraction > 0)) return null;
  return (
    <div className="mt-1.5 h-1.5 w-full min-w-[6rem]" aria-hidden="true">
      <div className="h-full rounded-r-[4px]" style={{ width: `${Math.round(Math.min(100, fraction * 100) * 100) / 100}%`, background: "var(--emphasis)" }} />
    </div>
  );
}

const stickyHead = "sticky left-0 z-10 [box-shadow:inset_-1px_0_0_var(--accent-2)]";
const stickyCell =
  "sticky left-0 z-10 [box-shadow:inset_-1px_0_0_var(--accent-2)] bg-[hsla(38,38%,97%,1)] group-hover:bg-[color-mix(in_srgb,black_6%,hsla(38,38%,97%,1))]";

const compareValues = (a, b) => {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
  if (b === null || b === undefined) return -1;
  return typeof a === "string" ? a.localeCompare(b) : a - b;
};

/**
 * rows: the data; first: the pinned name column { label, render(row), value(row) };
 * columns: [{ key, label, value(row) -> number|string|null, render(row), sub(row), bar, barMax, align }];
 *   a bar is drawn against `barMax` when set (100 for a percentage, so 3%
 *   never looks full), else against the column's largest value;
 * total: the All Branches row (rendered with the same columns), or null;
 * defaultSort: { key, dir }.
 */
export function DataTable({ rows, first, columns, total, totalLabel = "All branches", rowKey, defaultSort, empty = "Nothing to show for these dates." }) {
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

  const head = (key, label, align, extra = "") => {
    const active = sort?.key === key;
    return (
      <th
        key={key}
        className={`${tableThClass} ${align === "right" ? "text-right!" : ""} ${extra}`}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        style={key === "__first" ? { backgroundColor: cardBg } : undefined}
      >
        <button type="button" onClick={() => toggle(key)} className="inline-flex items-center gap-1 uppercase tracking-wide cursor-pointer">
          {label}
          {active ? (sort.dir === "asc" ? <IoArrowUp aria-hidden="true" /> : <IoArrowDown aria-hidden="true" />) : null}
        </button>
      </th>
    );
  };

  const cell = (col, row, isTotal) => {
    const v = col.value(row);
    return (
      <td key={col.key} className={`${tableTdClass} whitespace-nowrap ${col.align === "right" ? "text-right" : ""}`}>
        <div className={col.align === "right" ? "flex flex-col items-end" : ""}>
          <span>{col.render ? col.render(row) : v ?? DASH}</span>
          {col.sub && <span className="text-lg" style={mutedTextStyle}>{col.sub(row)}</span>}
          {col.bar && !isTotal && <Bar fraction={maxima[col.key] > 0 ? (Number(v) || 0) / maxima[col.key] : 0} />}
        </div>
      </td>
    );
  };

  return (
    <div className={tableCardClass} style={tableCardStyle}>
      <div className={tableScrollClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass} style={tableHeadRowStyle}>
              {head("__first", first.label, "left", stickyHead)}
              {columns.map((c) => head(c.key, c.label, c.align))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr style={tableRowStyle}>
                <td className={tableTdClass} colSpan={columns.length + 1} style={mutedTextStyle}>{empty}</td>
              </tr>
            )}
            {sorted.map((row, i) => (
              <tr key={rowKey ? rowKey(row) : i} className="group border-b last:border-0 transition-colors hover:bg-black/6" style={tableRowStyle}>
                <td className={`${tableTdClass} ${stickyCell} font-semibold max-lg:min-w-[16rem]`}>{first.render(row)}</td>
                {columns.map((c) => cell(c, row, false))}
              </tr>
            ))}
            {total && sorted.length > 0 && (
              <tr className="group border-t-2 font-semibold" style={{ ...tableRowStyle, borderTopColor: "var(--accent-2)" }}>
                <td className={`${tableTdClass} ${stickyCell}`}>{totalLabel}</td>
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
  // Anchored to the cell's side nearest the middle of the screen, so near an
  // edge it opens inwards instead of being squeezed against it.
  const show = (e, text) => {
    const r = e.currentTarget.getBoundingClientRect();
    const w = window.innerWidth;
    const centre = r.left + r.width / 2;
    const place = centre > (w * 2) / 3 ? { right: w - r.right } : centre < w / 3 ? { left: r.left } : { left: centre, shift: "-50%" };
    setTip({ text, top: r.top, ...place });
  };
  const fill = (value) => {
    if (value === null || value === undefined) return undefined;
    if (value < 0) return "color-mix(in srgb, var(--text-color) 10%, hsla(38,38%,97%,1))";
    if (value === 0 || !(max > 0)) return undefined;
    const p = Math.round(10 + 90 * Math.min(1, value / max));
    return `color-mix(in srgb, var(--emphasis) ${p}%, hsla(38,38%,97%,1))`;
  };
  return (
    <figure className="flex flex-col gap-3 m-0">
      <div className={tableCardClass} style={tableCardStyle}>
        <div className={tableScrollClass}>
          <table className="border-collapse text-lg">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className={tableHeadRowClass} style={tableHeadRowStyle}>
                <th className={`${tableThClass} ${stickyHead}`} style={{ backgroundColor: cardBg }}>Branch</th>
                {columns.map((c) => (
                  <th key={c.key} className="px-1 py-3 text-center font-semibold whitespace-nowrap min-w-[4.6rem]">
                    <span className="block">{c.label}</span>
                    {c.sub && <span className="block font-normal" style={mutedTextStyle}>{c.sub}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="group border-b last:border-0" style={tableRowStyle}>
                  <td className={`${tableTdClass} ${stickyCell} font-semibold whitespace-nowrap`}>{row.label}</td>
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
                        className="px-1 py-3 text-center whitespace-nowrap border-l-2 outline-none focus-visible:ring-2 focus-visible:ring-(--emphasis) hover:brightness-95"
                        style={{ background: fill(cellData.value), borderLeftColor: cardBg }}
                      >
                        <span style={cellData.value ? textColorStyle : mutedTextStyle}>{cellData.text ?? DASH}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="flex items-center gap-3 text-lg" style={mutedTextStyle}>
        <span>{legendLow}</span>
        <span
          className="h-3 w-40 rounded-sm"
          aria-hidden="true"
          style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--emphasis) 10%, hsla(38,38%,97%,1)), var(--emphasis))" }}
        />
        <span>{legendHigh}</span>
      </figcaption>
      {tip?.text && (
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 text-lg shadow-lg"
          style={{
            left: tip.left,
            right: tip.right,
            top: tip.top - 8,
            transform: `translate(${tip.shift || "0"}, -100%)`,
            width: "max-content",
            maxWidth: "min(44rem, calc(100vw - 1.6rem))",
            background: "var(--text-color)",
            color: "white",
          }}
        >
          {tip.text}
        </div>
      )}
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

export function Notice({ children }) {
  return (
    <p className={`${bodyText} rounded-lg border px-4 py-3`} style={{ ...textColorStyle, borderColor: "var(--emphasis)", backgroundColor: "hsla(38, 49%, 51%, 0.08)" }}>
      {children}
    </p>
  );
}

export function HowCounted({ children }) {
  return (
    <p className="text-lg" style={mutedTextStyle}>
      <span className="font-semibold">How this is counted: </span>
      {children}
    </p>
  );
}

// A segmented choice (Food / Drinks, a branch) for the lists that take one.
export function Choice({ label, value, options, onChange, id }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-lg font-semibold uppercase tracking-wide" style={mutedTextStyle}>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg px-4 py-2.5 text-xl"
        style={{ borderColor: "var(--accent-2)", backgroundColor: cardBg, ...textColorStyle }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
