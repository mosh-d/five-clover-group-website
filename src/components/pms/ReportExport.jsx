"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { IoDocumentTextOutline } from "react-icons/io5";
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
//   <TableCard report="Stay-Overs">            <table>...</table> </TableCard>
//   <ReportSection title="Arrivals" report>    <table>...</table> </ReportSection>
//   <DataTable ... report="Occupancy by Branch" />
//
// and gets an Export Report button that prints exactly what the table shows -
// every row, a paged list's other pages included - on a sheet wearing the
// branch's logo and colours (lib/pms/reportSheet.js). A report wraps its
// content in <ReportScope> to say which dates it covers; `report={{ title,
// subtitle, figures: true }}` also carries the report's headline figures
// (SummaryCard / StatTile) onto the sheet.

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
 * The button. `target` is a ref to what holds the table(s); `title` names
 * this table on the sheet (the heading above it when not given).
 */
export function ReportExportButton({ target, title, subtitle, figures = false, label = "Export Report", className = "" }) {
  const scope = useContext(ScopeContext);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);
  const run = async () => {
    const root = target.current;
    if (!root) return;
    // Every paged list shows all its rows for this one render.
    let sections;
    flushSync(() => setShowAllRows(true));
    try {
      sections = readSections(root);
    } finally {
      flushSync(() => setShowAllRows(false));
    }
    // A table the server pages fetches every row, as its CSV does.
    if (sections.some((s) => s.loadId && loaders.has(s.loadId))) {
      try {
        setBusy(true);
        setFailed(null);
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
  return (
    <>
      <button type="button" onClick={run} disabled={busy} className={`${btn.rowSecondary} inline-flex items-center gap-2 ${className}`}>
        <IoDocumentTextOutline size={18} aria-hidden="true" />
        {busy ? "Preparing..." : label}
      </button>
      {failed && (
        <span role="alert" className="text-lg text-red-600">
          {failed}
        </span>
      )}
    </>
  );
}

/**
 * The whole report on one sheet - every section and table in the
 * <ReportScope>, with its headline figures - for beside a report's own
 * export buttons.
 */
export function ReportExportAll({ className = "" }) {
  const scope = useContext(ScopeContext);
  if (!scope) return null;
  return <ReportExportButton target={scope.ref} title={scope.name} figures label="Export Full Report" className={className} />;
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
 * The PMS's table card (table.card + table.scroll), with the Export Report
 * button above it when given `report`.
 */
export function TableCard({ report, className = "", children }) {
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
  if (!report) return card;
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-end">
        <ReportExportButton target={ref} {...reportProps(report)} />
      </div>
      {card}
    </div>
  );
}
