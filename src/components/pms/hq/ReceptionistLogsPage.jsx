"use client";

import { useEffect, useState } from "react";
import { IoBookOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import usePagedRows from "@/components/pms/usePagedRows";
import { Tip } from "@/components/pms/Tip";
import { ReportScope, TableCard } from "@/components/pms/ReportExport";
import { field, page, table } from "@/components/pms/ui";
import { formatDate, formatDateTime } from "@/lib/pms/format";
import { http } from "@/lib/pms/http";

// Receptionist Logs at Head Office (owner, 2026-11-26: "add receptionist logs
// to the head office for the HR staff"): every branch's front desk log book -
// what was written, by whom and when, and who read it - over the dates
// picked. Head HR's and HR's, and the developer's. Read only.

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const day = (iso) => formatDate(`${String(iso).slice(0, 10)}T12:00:00Z`);

export default function ReceptionistLogsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [branch, setBranch] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    http.get("/api/hq/log-book", { params: { from: from || undefined, to: to || undefined, branch_id: branch || undefined } }).then(
      ({ data: d }) => {
        if (cancelled) return;
        setData(d);
        setError(null);
        // The server's default range (the last 7 business days) fills the pickers.
        if (!from) setFrom(d.from);
        if (!to) setTo(d.to);
      },
      (err) => !cancelled && setError(err.message || "Could not load the logs."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, branch]);

  const paged = usePagedRows(data?.entries || []);

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoBookOutline}
        tipId="hqLogs.page"
        title="Receptionist Logs"
        description="Every branch's front desk log book: what was written, by whom and when, and who read it."
      />
      {error && <p className={`${field.error} w-full`}>{error}</p>}
      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <ReportScope name="Receptionist Logs" from={data.from} to={data.to}>
            <div className={page.toolbar}>
              <div className="grid grid-cols-2 gap-4 w-full sm:flex sm:w-auto">
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="hl-from" className={field.label}>
                    From<Tip id="hqLogs.from" />
                  </label>
                  <DateInput id="hl-from" value={from} max={data.today} onChange={(e) => ISO.test(e.target.value) && (setFrom(e.target.value), e.target.value > to && setTo(e.target.value))} className={field.input} />
                </div>
                <div className="flex flex-col gap-2 min-w-0 sm:w-[20rem]">
                  <label htmlFor="hl-to" className={field.label}>
                    To
                  </label>
                  <DateInput id="hl-to" value={to} min={from} max={data.today} onChange={(e) => ISO.test(e.target.value) && setTo(e.target.value)} className={field.input} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="hl-branch" className={field.label}>
                  Branch<Tip id="hqLogs.branch" />
                </label>
                <select id="hl-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className={field.select}>
                  <option value="">Every branch</option>
                  {data.branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <TableCard
              report="Receptionist Logs"
              heading={
                <h2 className={page.sectionTitle}>
                  Log Book Notes<Tip id="hqLogs.list" />
                </h2>
              }
            >
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Date</th>
                    <th className={table.th}>Branch</th>
                    <th className={table.th}>Written By</th>
                    <th className={table.th}>Note</th>
                    <th className={table.th}>Read By<Tip id="hqLogs.col.read" /></th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={table.empty}>
                        No log book notes for these dates.
                      </td>
                    </tr>
                  ) : (
                    paged.rows.map((e) => (
                      <tr key={e.id} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd} whitespace-nowrap`}>
                          {day(e.business_date)}
                          <span className="block text-lg text-(--text-color)/68">{formatDateTime(e.created_at)}</span>
                        </td>
                        <td className={table.td}>{e.branch_name}</td>
                        <td className={table.td}>{e.written_by_name || "—"}</td>
                        <td className={`${table.td} whitespace-pre-line! min-w-[24rem]`}>{e.note}</td>
                        <td className={table.td}>
                          {e.read_at ? (
                            <>
                              {e.read_by_name || "—"}
                              <span className="block text-lg text-(--text-color)/68">{formatDateTime(e.read_at)}</span>
                            </>
                          ) : (
                            <span className="text-(--text-color)/60">Not read yet</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableCard>
            <Pagination page={paged.page} totalPages={paged.totalPages} onPage={paged.setPage} />
          </ReportScope>
        )
      )}
    </div>
  );
}
