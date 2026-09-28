"use client";

import { useCallback, useEffect, useState } from "react";
import { IoMoonOutline } from "react-icons/io5";
import PageHeading from "@/components/admin/PageHeading";
import DateInput from "@/components/pms/DateInput";
import Pagination from "@/components/pms/Pagination";
import GuestName from "@/components/pms/GuestName";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, card, field, page, table } from "@/components/pms/ui";
import { nightAudit } from "@/lib/pms/api";
import { yesterdayISO } from "@/lib/pms/dates";
import { formatDate, formatTime, money } from "@/lib/pms/format";

const PAGE_SIZE = 10;

// Night Audit - the branch PMS's page (AdminNightAudit.jsx): run the nightly
// close-out that posts every in-house guest's room charge, and the history
// of past runs. The date defaults to yesterday by the hotel's clock (Lagos,
// server time), not this computer's.
export default function PmsNightAuditPage() {
  const [auditDate, setAuditDate] = useState(yesterdayISO);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [runError, setRunError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const loadHistory = useCallback(async (p = 1) => {
    try {
      setHistoryLoading(true);
      const data = await nightAudit.history({ page: p, limit: PAGE_SIZE });
      setHistory(data.data || []);
      setHistoryTotal(data.total || 0);
      setHistoryPage(p);
      setHistoryError(null);
    } catch (err) {
      setHistoryError(`${err.message || "Failed to load audit history."} Please refresh the page.`);
    } finally {
      setHistoryLoading(false);
    }
  }, []);
  const loadFirstPage = useCallback(() => loadHistory(1), [loadHistory]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);
  // Again when the live connection comes back (e.g. after a backend restart).
  useLiveRefresh(loadFirstPage, []);

  const handleRun = async () => {
    if (!auditDate) return;
    try {
      setRunning(true);
      setResult(null);
      setRunError(null);
      setResult(await nightAudit.run(auditDate));
      loadHistory(1);
    } catch (err) {
      setRunError(err.message || "Audit failed. Check if it has already been run for this date.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <div>
        <PageHeading icon={IoMoonOutline}>Night Audit</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>Posts nightly room charges to all in-house guest folios. Runs automatically at 2am if not triggered manually.</p>
      </div>

      <div className={`w-full ${card.surface} p-8 flex flex-col gap-6`}>
        <h2 className={page.sectionTitle}>Run Audit</h2>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="audit-date" className={field.label}>Business Date</label>
            <DateInput
              id="audit-date"
              value={auditDate}
              max={yesterdayISO()}
              onChange={(e) => {
                setAuditDate(e.target.value);
                setResult(null);
                setRunError(null);
              }}
            />
          </div>
          <button onClick={handleRun} disabled={running || !auditDate} className={btn.primary}>
            {running ? "Running..." : "Run Night Audit"}
          </button>
        </div>

        {runError && <p className={field.error}>{runError}</p>}

        {result && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Date Audited" value={formatDate(result.audit.audit_date)} />
              <StatCard label="Guests Charged" value={result.audit.rooms_charged} accent />
              <StatCard label="Total Posted" value={money(result.audit.total_posted)} accent />
              <StatCard label="Skipped" value={result.audit.skipped} warn={result.audit.skipped > 0} />
            </div>

            {result.details?.length > 0 && (
              <div className={`${table.card} mt-2`}>
                <div className={table.scroll}>
                  <table className={table.el}>
                    <thead>
                      <tr className={table.headRow}>
                        <th className={`${table.th} ${table.stickyTh}`}>Guest</th>
                        <th className={`${table.th} hidden md:table-cell`}>Room Type</th>
                        <th className={`${table.th} hidden md:table-cell`}>Folio</th>
                        <th className={`${table.th} text-right!`}>Charge</th>
                        <th className={table.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((d, i) => (
                        <tr key={i} className={table.row}>
                          <td className={`${table.td} ${table.stickyTd} font-medium`}>
                            <div><GuestName name={d.guest_name} tags={d.guest_tags} /></div>
                            {d.booking_reference && <div className={`text-base ${page.muted}`}>{d.booking_reference}</div>}
                          </td>
                          <td className={`${table.td} hidden md:table-cell`}>
                            {d.skipped ? "—" : `${d.room_type}${d.rooms_booked > 1 ? ` × ${d.rooms_booked}` : ""}`}
                          </td>
                          <td className={`${table.td} hidden md:table-cell`}>{d.folio_number || "—"}</td>
                          <td className={`${table.td} text-right! font-bold`}>{d.skipped ? "—" : money(d.charge)}</td>
                          <td className={table.td}>
                            {d.skipped ? (
                              <span className="text-orange-600 font-semibold">Skipped — {d.reason}</span>
                            ) : (
                              <span className="text-green-700 font-semibold">Posted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full flex flex-col gap-4">
        <h2 className={page.sectionTitle}>Audit History</h2>
        {historyLoading ? (
          <p className={`text-xl ${page.muted}`}>Loading…</p>
        ) : historyError ? (
          <p className={field.error}>{historyError}</p>
        ) : history.length === 0 ? (
          <p className={`text-2xl ${page.muted}`}>No audits have been run yet.</p>
        ) : (
          <>
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Business Date</th>
                      <th className={`${table.th} text-right! hidden md:table-cell`}>Guests Charged</th>
                      <th className={`${table.th} text-right! hidden md:table-cell`}>Skipped</th>
                      <th className={`${table.th} text-right!`}>Total Posted</th>
                      <th className={`${table.th} hidden md:table-cell`}>Run At</th>
                      <th className={`${table.th} hidden md:table-cell`}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a) => (
                      <tr key={a.id} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd} font-bold`}>{formatDate(a.audit_date)}</td>
                        <td className={`${table.td} text-right! hidden md:table-cell`}>{a.rooms_charged}</td>
                        <td className={`${table.td} text-right! hidden md:table-cell`}>{a.skipped}</td>
                        <td className={`${table.td} text-right! font-bold text-green-700!`}>{money(a.total_posted)}</td>
                        <td className={`${table.td} hidden md:table-cell`}>{formatTime(a.audited_at)}</td>
                        <td className={`${table.td} hidden md:table-cell`}>
                          <span className={`text-xl font-semibold px-3 py-1 rounded-full ${a.auto_run ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                            {a.auto_run ? "Auto" : "Manual"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={historyPage} totalPages={Math.ceil(historyTotal / PAGE_SIZE)} onPage={loadHistory} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, warn }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-(--emphasis) border-transparent text-white" : warn ? "bg-orange-50 border-orange-200" : "bg-(--card) border-(--accent-2)"}`}>
      <p className={`text-xl font-semibold uppercase tracking-wide mb-1 ${accent ? "text-white/70" : "text-(--text-color)/68"}`}>{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-white" : warn ? "text-orange-600" : "text-(--black)"}`}>{value}</p>
    </div>
  );
}
