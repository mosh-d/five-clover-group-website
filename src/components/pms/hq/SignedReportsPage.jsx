"use client";

import { useEffect, useMemo, useState } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import Modal from "@/components/pms/Modal";
import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import usePagedRows from "@/components/pms/usePagedRows";
import { Tip } from "@/components/pms/Tip";
import SignedSheetView from "@/components/pms/signoff/SignedSheetView";
import { printSheet } from "@/components/pms/ReportExport";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDate, formatDateTime } from "@/lib/pms/format";
import { applyCorrections, printableSheet } from "@/lib/pms/signedSheet";
import { fetchSignedReport, fetchSignedReports } from "@/lib/pms/api/report-signoffs-api";

// Head Office's Auditor (owner, 2026-11-26; backend phase-104): every report
// a branch's accountant has signed off, newest first. Read only - each opens
// exactly as signed, with every correction and note shown as the
// accountant's, and prints on the branch's branded sheet.

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const day = (iso) => formatDate(`${String(iso).slice(0, 10)}T12:00:00Z`);
const periodOf = (r) => (r.period_from === r.period_to ? day(r.period_from) : `${day(r.period_from)} - ${day(r.period_to)}`);

function SignedReportDialog({ id, onClose }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchSignedReport(id).then(setReport, (err) => setError(err.message || "Could not load the report."));
  }, [id]);
  const view = useMemo(() => (report ? applyCorrections(report.sheet, report.corrections) : null), [report]);
  const signedLine = report ? `Signed off by ${report.signed_by_name || "the accountant"} at ${report.branch_name}, ${formatDateTime(report.signed_at)}${report.version > 1 ? ` (version ${report.version})` : ""}.` : "";
  return (
    <Modal onClose={onClose} title={report ? `${report.report_name} - ${report.branch_name}` : "Signed Report"} subtitle={report ? `${periodOf(report)} · ${signedLine}` : undefined} size="full">
      {error ? (
        <p className={field.error}>{error}</p>
      ) : !view ? (
        <LoadingSpinner size="lg" />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={btn.primary}
              onClick={() => printSheet(printableSheet(view, signedLine), { branch: { name: report.branch_name, branch_code: report.branch_code } })}
            >
              Print Report
            </button>
            <span className="self-center text-lg text-(--text-color)/68">
              {view.count.corrections} correction(s), {view.count.notes} note(s) by the accountant
            </span>
          </div>
          <SignedSheetView view={view} />
        </div>
      )}
    </Modal>
  );
}

export default function SignedReportsPage() {
  const [branch, setBranch] = useState("");
  const [reportKey, setReportKey] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // A notification links straight to one (?id=).
  const [openId, setOpenId] = useState(() => {
    if (typeof window === "undefined") return null;
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    return id || null;
  });

  useEffect(() => {
    let cancelled = false;
    fetchSignedReports({ branch_id: branch || undefined, report_key: reportKey || undefined, from: from || undefined, to: to || undefined }).then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the signed reports."),
    );
    return () => {
      cancelled = true;
    };
  }, [branch, reportKey, from, to]);

  const paged = usePagedRows(data?.signoffs || []);

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoDocumentTextOutline}
        tipId="signedReports.page"
        title="Signed Reports"
        description="Every report a branch's accountant has signed off, newest first. Open one to see it exactly as signed - every correction and note marked as the accountant's - or print it."
      />
      {error && <p className={`${field.error} w-full`}>{error}</p>}
      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <>
            <div className={page.toolbar}>
              <div className="flex flex-col gap-2">
                <label htmlFor="sr-branch" className={field.label}>
                  Branch<Tip id="signedReports.branch" />
                </label>
                <select id="sr-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className={field.select}>
                  <option value="">Every branch</option>
                  {data.branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="sr-report" className={field.label}>
                  Report<Tip id="signedReports.report" />
                </label>
                <select id="sr-report" value={reportKey} onChange={(e) => setReportKey(e.target.value)} className={field.select}>
                  <option value="">Every report</option>
                  {data.reports.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full sm:flex sm:w-auto">
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="sr-from" className={field.label}>
                    From<Tip id="signedReports.from" />
                  </label>
                  <DateInput id="sr-from" value={from} onChange={(e) => (ISO.test(e.target.value) || !e.target.value) && setFrom(e.target.value)} className={field.input} />
                </div>
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="sr-to" className={field.label}>
                    To
                  </label>
                  <DateInput id="sr-to" value={to} min={from || undefined} onChange={(e) => (ISO.test(e.target.value) || !e.target.value) && setTo(e.target.value)} className={field.input} />
                </div>
              </div>
            </div>

            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Report<Tip id="signedReports.col.report" /></th>
                      <th className={table.th}>Branch</th>
                      <th className={table.th}>For<Tip id="signedReports.col.period" /></th>
                      <th className={table.th}>Signed Off<Tip id="signedReports.col.signed" /></th>
                      <th className={table.th}>Corrections<Tip id="signedReports.col.corrections" /></th>
                      <th className={table.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.signoffs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={table.empty}>
                          No signed reports yet.
                        </td>
                      </tr>
                    ) : (
                      paged.rows.map((r) => (
                        <tr key={r.id} className={table.row}>
                          <td className={`${table.td} ${table.stickyTd} font-semibold`}>
                            {r.report_name}
                            {r.version > 1 && <span className="ml-2 text-base font-normal text-(--text-color)/68">version {r.version}</span>}
                          </td>
                          <td className={table.td}>{r.branch_name}</td>
                          <td className={table.td}>{periodOf(r)}</td>
                          <td className={table.td}>
                            {r.signed_by_name || "—"}
                            <span className="block text-lg text-(--text-color)/68">{formatDateTime(r.signed_at)}</span>
                          </td>
                          <td className={table.td}>
                            {r.corrections || r.notes ? (
                              <span className="font-semibold text-amber-800">
                                {r.corrections} correction(s), {r.notes} note(s)
                              </span>
                            ) : (
                              <span className="text-(--text-color)/60">None</span>
                            )}
                          </td>
                          <td className={table.td}>
                            <button type="button" className={btn.rowPrimary} onClick={() => setOpenId(r.id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={paged.page} totalPages={paged.totalPages} onPage={paged.setPage} />
          </>
        )
      )}
      {openId && <SignedReportDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
