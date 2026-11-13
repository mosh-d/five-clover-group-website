"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { IoChevronDown, IoPrintOutline } from "react-icons/io5";
import { btn, table } from "@/components/pms/ui";
import { getStoredBranch, getStoredStaffUsername } from "@/lib/pms/auth";
import { formatDate, formatDateTime } from "@/lib/pms/format";
import { printDocument } from "@/lib/pms/print";
import { buildReportSheet, dataTable, headingNear, periodLabel, readFigures, readSections } from "@/lib/pms/reportSheet";
import { setShowAllRows } from "@/components/pms/usePagedRows";
import { BRANDS, GROUP_BRAND, brandForBranch, logoForBranch } from "@/components/pms/theme/brands";

// The branded report sheet, at the root (owner, 2026-11-12: "do this at the
// component/root level so each table can receive it as a prop"). A table
// takes it with one prop:
//
//   <TableCard report="Stay-Overs" heading={<h2>...</h2>}>  <table>...</table> </TableCard>
//   <ReportSection title="Arrivals" report>                  <table>...</table> </ReportSection>
//   <DataTable ... report="Occupancy by Branch" />
//
// and gets a Print Report button that prints exactly what the table shows -
// every row, a paged list's other pages included - on a sheet wearing the
// branch's logo and colours (lib/pms/reportSheet.js). A report wraps its
// content in <ReportScope> to say which dates it covers; `report={{ title,
// subtitle, figures: true }}` also carries the report's headline figures
// (SummaryCard / StatTile) onto the sheet.
//
// The buttons sit in the table's own heading row, beside its other downloads
// (CSV, Excel), never on a row of their own (owner, 2026-11-13: "the new
// button is pushing the table down"); on a phone two or more fold into one
// Export menu (ExportActions).

const ScopeContext = createContext(null);

/** The dates (and, if the page's own title won't do, the name) a report covers. */
export function ReportScope({ name, from, to, date, period, children }) {
  const ref = useRef(null);
  const label = period || periodLabel(from ?? date, to ?? date, formatDate);
  return (
    <ScopeContext.Provider value={{ name, period: label, ref }}>
      <div ref={ref} className="contents">
        {children}
      </div>
    </ScopeContext.Provider>
  );
}

// The report's name when no scope gives one: the page's title and the tab
// open on it ("Reports - Accommodation").
function pageReportName() {
  const page = document.querySelector("[data-report-page]")?.getAttribute("data-report-page") || "";
  const tab = document.querySelector('[role="tab"][aria-selected="true"]')?.innerText?.trim() || "";
  return [page, tab].filter(Boolean).join(" - ") || document.title || "Report";
}

// Loaders for tables the server pages (report.load), by the id on their card.
const loaders = new Map();

const absolute = (img) => (img ? new URL(typeof img === "string" ? img : img.src, window.location.href).href : "");

/**
 * Makes the sheet. `target` is a ref to what holds the table(s); `title`
 * names it on the sheet (the heading above it when not given). Returns
 * { run, busy, failed }.
 */
function useReportExport({ target, title, subtitle, figures = false }) {
  const scope = useContext(ScopeContext);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);
  const run = async () => {
    const root = target?.current;
    if (!root) return;
    // Every paged list shows all its rows for this one render.
    let sections;
    flushSync(() => setShowAllRows(true));
    try {
      sections = readSections(root);
    } finally {
      flushSync(() => setShowAllRows(false));
    }
    setFailed(null);
    // A table the server pages fetches every row, as its CSV does.
    if (sections.some((s) => s.loadId && loaders.has(s.loadId))) {
      try {
        setBusy(true);
        sections = await Promise.all(sections.map(async (s) => (s.loadId && loaders.has(s.loadId) ? { ...s, ...dataTable(await loaders.get(s.loadId)()) } : s)));
      } catch (err) {
        setFailed(err?.message || "Could not load the rows for the report.");
        return;
      } finally {
        setBusy(false);
      }
    }
    const name = scope?.name || pageReportName();
    const heading = title || sections[0]?.heading || headingNear(root) || name;
    // The full report is titled by the report itself.
    const whole = scope && root === scope.ref.current;
    const branch = getStoredBranch();
    const brand = branch ? brandForBranch(branch) : GROUP_BRAND;
    printDocument(
      buildReportSheet({
        brand,
        logo: absolute(branch ? logoForBranch(branch) : GROUP_BRAND.logo),
        marks: [BRANDS.fc, BRANDS.ci, BRANDS.rr].map((b) => ({ name: b.name, src: absolute(b.logoOnLight) })),
        place: branch?.name || "Head Office",
        report: name,
        title: whole ? name : heading,
        subtitle,
        period: scope?.period || "",
        preparedBy: getStoredStaffUsername(),
        generatedAt: formatDateTime(new Date()),
        figures: figures ? readFigures(scope?.ref.current) : [],
        sections: sections.length ? sections : [{ heading, columns: [], rows: [], totals: [], note: "" }],
      }),
    );
  };
  return { run, busy, failed };
}

const SheetIcon = () => <IoPrintOutline size={20} aria-hidden="true" className="shrink-0" />;

/**
 * A table's or a report's download buttons, side by side - and on a phone,
 * when there are two or more, one Export menu holding them.
 *   actions: [{ label, onClick, disabled, title }] - its own (CSV, Excel);
 *   report:  { target, title, subtitle, figures } - adds Print Report;
 *   full:    adds Print Full Report (the whole <ReportScope> it is in).
 */
export function ExportActions({ actions = [], report, full = false, className = "" }) {
  const scope = useContext(ScopeContext);
  const one = useReportExport(report || {});
  const all = useReportExport({ target: scope?.ref, title: scope?.name, figures: true });
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => menuRef.current && !menuRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);

  const list = [
    ...actions.filter(Boolean),
    ...(report ? [{ label: one.busy ? "Preparing..." : "Print Report", onClick: one.run, disabled: one.busy, sheet: true }] : []),
    ...(full && scope ? [{ label: all.busy ? "Preparing..." : "Print Full Report", onClick: all.run, disabled: all.busy, sheet: true }] : []),
  ];
  const failed = one.failed || all.failed;
  if (!list.length) return null;

  const button = (a, extra = "") => (
    <button key={a.label} type="button" onClick={a.onClick} disabled={a.disabled} title={a.title} className={`${btn.secondary} inline-flex items-center justify-center gap-2 whitespace-nowrap ${extra}`}>
      {a.sheet && <SheetIcon />}
      {a.label}
    </button>
  );

  return (
    <div className={`flex flex-col items-end gap-2 ${className}`}>
      {/* Side by side from a small tablet up. */}
      <div className={`${list.length > 1 ? "max-sm:hidden" : ""} flex flex-wrap items-center justify-end gap-3`}>{list.map((a) => button(a))}</div>
      {/* A phone: one Export menu. */}
      {list.length > 1 && (
        <div ref={menuRef} className="sm:hidden relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`${btn.secondary} inline-flex items-center gap-2`}
          >
            Export
            <IoChevronDown size={18} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 z-30 mt-2 min-w-[15rem] bg-(--card) border border-(--accent-2) rounded-xl shadow-lg overflow-hidden">
              {list.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  role="menuitem"
                  disabled={a.disabled}
                  title={a.title}
                  onClick={() => {
                    setOpen(false);
                    a.onClick();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-xl text-left whitespace-nowrap cursor-pointer text-(--text-color) hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {a.sheet && <SheetIcon />}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {failed && (
        <span role="alert" className="text-lg text-red-600">
          {failed}
        </span>
      )}
    </div>
  );
}

/** One Print Report button (a ReportSection's heading). */
export function ReportExportButton({ target, title, subtitle, figures = false }) {
  return <ExportActions report={{ target, title, subtitle, figures }} />;
}

/**
 * The whole report on one sheet - every section and table in the
 * <ReportScope>, with its headline figures. Where a report has its own
 * downloads, give them to <ExportActions full actions={...}> instead, so they
 * sit together.
 */
export function ReportExportAll({ className = "" }) {
  return <ExportActions full className={className} />;
}

// `report`: a title string, true (the heading above the table), or
// { title, subtitle, figures, load }. `load` is for a table the server pages:
// it fetches every row as { columns, rows, right } (lib/pms/reportSheet.js
// dataTable), so the sheet isn't just the page on the screen.
export const reportProps = (report) => {
  if (!report || typeof report !== "object") return { title: typeof report === "string" ? report : undefined };
  const { load: _load, ...rest } = report;
  return rest;
};

/**
 * The PMS's table card (table.card + table.scroll). With `report` it gets an
 * Print Report button; `heading` (the table's title) and `actions` (its other
 * downloads) share that one row with it, the buttons on the right.
 */
export function TableCard({ report, heading, actions, className = "", children }) {
  const ref = useRef(null);
  const id = useId();
  const load = report && typeof report === "object" ? report.load : null;
  // The newest loader, for both this card's button and a full report's.
  useEffect(() => {
    if (!load) return undefined;
    loaders.set(id, load);
    return () => loaders.delete(id);
  }, [id, load]);
  const card = (
    <div ref={ref} data-report-load={load ? id : undefined} className={`${table.card} ${className}`}>
      <div className={table.scroll}>{children}</div>
    </div>
  );
  if (!report && !heading && !actions?.length) return card;
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {heading || <span />}
        <ExportActions actions={actions} report={report ? { target: ref, ...reportProps(report) } : undefined} />
      </div>
      {card}
    </div>
  );
}
