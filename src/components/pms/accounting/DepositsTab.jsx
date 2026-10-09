"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Notice from "@/components/pms/Notice";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import Pagination from "@/components/pms/Pagination";
import usePagedRows from "@/components/pms/usePagedRows";
import RefundCreditModal from "@/components/pms/RefundCreditModal";
import { Tip } from "@/components/pms/Tip";
import { AuditLink } from "@/components/pms/reportUi";
import { auditFor } from "./audit";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDate, formatPaymentMethod, money } from "@/lib/pms/format";
import { fetchDepositLedger } from "@/lib/pms/api/accounting-api";
import { refundDeposit } from "@/lib/pms/api/folios-api";

// Deposits (Accounting, Step 5): every bit of reservation credit the branch
// holds - paid ahead for a booking, or an overpayment kept on a stay - that
// hasn't been spent or paid back: on bookings still to arrive, on guests in
// the house, and, to chase, for guests who left, no-shows and cancelled
// bookings. The accountant refunds it from here, with the refund the front
// desk uses.

const ago = (days) => (days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`);

function GroupTable({ group, today, onRefund, onFolio }) {
  const paged = usePagedRows(group.credits);
  return (
    <section className="w-full flex flex-col gap-4">
      <h3 className="text-2xl font-bold text-(--black)">
        {group.label}
        <span className={`ml-3 text-xl font-semibold ${page.muted}`}>{group.count} · {money(group.amount)}</span>
        <Tip id={`accounting.deposits.group.${group.key}`} />
      </h3>
      {group.count === 0 ? (
        <p className={`text-xl ${page.muted}`}>None.</p>
      ) : (
        <>
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Guest<Tip id="accounting.deposits.col.guest" /></th>
                    <th className={table.th}>Taken<Tip id="accounting.deposits.col.taken" /></th>
                    {group.chase && <th className={table.th}>Waiting<Tip id="accounting.deposits.col.waiting" /></th>}
                    <th className={`${table.th} hidden md:table-cell`}>Receipt<Tip id="accounting.deposits.col.receipt" /></th>
                    <th className={`${table.th} text-right!`}>Credit<Tip id="accounting.deposits.col.credit" /></th>
                    <th className={table.th}>Actions<Tip id="accounting.deposits.col.actions" /></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.rows.map((c) => (
                    <tr key={c.id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd}`}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{c.guest_name || "No booking"}</span>
                          <span className={`text-lg ${page.muted}`}>
                            {[c.booking_reference && `Booking ${c.booking_reference}`, c.phone].filter(Boolean).join(" · ")}
                          </span>
                          {group.key === "arriving" && c.check_in && <span className={`text-lg ${page.muted}`}>Arrives {formatDate(c.check_in)}</span>}
                        </div>
                      </td>
                      <td className={table.td}>
                        <div>{formatDate(`${c.taken}T12:00:00Z`)}</div>
                        <div className={`text-lg ${page.muted}`}>{[ago(c.taken_days), c.taken_by].filter(Boolean).join(" · ")}</div>
                      </td>
                      {group.chase && (
                        <td className={`${table.td} ${c.waiting_days > 30 ? "text-red-600 font-semibold" : ""}`}>{ago(c.waiting_days)}</td>
                      )}
                      <td className={`${table.td} hidden md:table-cell`}>
                        <div className="font-mono text-lg">{c.deposit_reference}</div>
                        <div className={`text-lg ${page.muted}`}>{c.receipt_number ? `Receipt #${c.receipt_number}` : "No receipt number"}</div>
                      </td>
                      <td className={`${table.td} text-right!`}>
                        <div className="font-bold text-green-700">{money(c.available)}</div>
                        <div className={`text-lg ${page.muted}`}>
                          {[c.method, c.from_overpayment ? "overpayment" : "paid ahead"].filter(Boolean).join(" · ")}
                          {c.amount_applied > 0 ? ` · ${money(c.amount_applied)} of ${money(c.amount)} used` : ""}
                        </div>
                      </td>
                      <td className={table.td}>
                        <div className={table.actions}>
                          <button type="button" onClick={() => onRefund(c)} className={btn.rowDanger}>Refund</button>
                          {c.folio_id && <button type="button" onClick={() => onFolio(c.folio_id)} className={btn.rowSecondary}>Folio</button>}
                          <AuditLink audit={auditFor({ search: c.guest_name || c.deposit_reference, from: c.taken, to: today })} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={paged.page} totalPages={paged.totalPages} onPage={paged.setPage} className="mt-0" />
        </>
      )}
    </section>
  );
}

function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Where", "Guest", "Booking", "Phone", "Reference", "Receipt", "Method", "Taken", "Days held", "Waiting since", "Days waiting", "Paid", "Used", "Credit left", "Kind"]];
  for (const g of view.groups) {
    for (const c of g.credits) {
      lines.push([g.label, c.guest_name || "No booking", c.booking_reference, c.phone, c.deposit_reference, c.receipt_number, c.method, c.taken, c.taken_days, c.waiting_since, c.waiting_days, c.amount, c.amount_applied, c.available, c.from_overpayment ? "Overpayment" : "Paid ahead"]);
    }
  }
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `deposits_${view.today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DepositsTab() {
  const router = useRouter();
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState(null);

  const load = useCallback(
    () =>
      fetchDepositLedger().then(
        (d) => {
          setView(d);
          setError(null);
        },
        (err) => setError(err.message || "Could not load the deposits."),
      ),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    fetchDepositLedger().then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the deposits."),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  useLiveRefresh(load, []);

  const refund = async (method) => {
    const c = refundTarget;
    try {
      setRefunding(true);
      setRefundError(null);
      await refundDeposit(c.id, method);
      setRefundTarget(null);
      setNotice(`Refunded ${money(c.available)} (${c.deposit_reference}) to ${c.guest_name || "the guest"} by ${formatPaymentMethod(method)}.`);
      load();
    } catch (err) {
      setRefundTarget(null);
      setRefundError(err.message || "Could not refund the credit.");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Deposits
          <Tip id="accounting.deposits" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          Every bit of reservation credit the branch holds and hasn&apos;t spent or paid back, by where its stay is. Credit for stays that have ended is yours to chase: refund it, or have the front desk move it to a stay the guest has now.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {(error || refundError) && <p className={`${field.error} w-full`}>{error || refundError}</p>}

      {!view && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        view && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>Held</strong>: {money(view.totals.held)} ({view.totals.count})</span>
              <span className={`px-4 py-2 rounded-lg text-xl ${view.totals.to_chase > 0 ? "bg-orange-100 text-orange-700" : "bg-black/5"}`}>
                <strong>To chase</strong>: {money(view.totals.to_chase)}
              </span>
              <Tip id="accounting.deposits.totals" />
              {view.totals.count > 0 && (
                <button type="button" onClick={() => downloadCsv(view)} className={btn.secondary}>Download CSV</button>
              )}
            </div>
            {/* What there is to chase first. */}
            {[...view.groups.filter((g) => g.chase), ...view.groups.filter((g) => !g.chase)]
              .filter((g) => g.count > 0 || !g.chase)
              .map((g) => (
                <GroupTable key={g.key} group={g} today={view.today} onRefund={setRefundTarget} onFolio={(id) => router.push(`/pms/folios?folio_id=${id}`)} />
              ))}
          </>
        )
      )}

      {refundTarget && (
        <RefundCreditModal
          credit={refundTarget}
          reference={refundTarget.deposit_reference}
          guestName={refundTarget.guest_name}
          busy={refunding}
          onConfirm={refund}
          onClose={() => setRefundTarget(null)}
        />
      )}
    </section>
  );
}
