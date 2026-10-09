"use client";

import { useCallback, useEffect, useState } from "react";
import { IoBusinessOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import Modal from "@/components/pms/Modal";
import StatusBadge from "@/components/pms/StatusBadge";
import GuestName from "@/components/pms/GuestName";
import { btn, field, page, table } from "@/components/pms/ui";
import { fetchOtaSettlements, markOtaSettlementPaid } from "@/lib/pms/api/ota-api";
import { money } from "@/lib/pms/format";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import Notice from "@/components/pms/Notice";
import { Tip } from "@/components/pms/Tip";

// OTA Payments - the branch PMS's page (AdminOtaPayments.jsx): money owed by
// OTAs rather than by guests. It lives on its own page because an OTA
// normally pays well after the guest has gone, when the folio is off every
// in-house list. Awaiting Payment is the chase list; Paid is the record of
// what has landed.
const TABS = [
  { key: "pending", label: "Awaiting Payment" },
  { key: "paid", label: "Paid" },
];

export default function PmsOtaPaymentsPage() {
  const [status, setStatus] = useState("pending");
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [reference, setReference] = useState("");
  const [received, setReceived] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSettlements((await fetchOtaSettlements(status)) || []);
    } catch (err) {
      setError(`${err.message || "Failed to load OTA payments."} Please refresh the page.`);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  // What the OTA kept: the expected amount less what arrived (never below nothing).
  const expectedOf = (s) => Number(s?.amount || 0);
  const receivedNumber = received === "" ? null : Number(received);
  const commission = confirming && receivedNumber !== null ? Math.max(0, Math.round((expectedOf(confirming) - receivedNumber) * 100) / 100) : 0;
  const receivedProblem =
    receivedNumber === null ? "Enter what arrived." : !(receivedNumber > 0) ? "What arrived has to be more than nothing." : null;

  const confirmPaid = async () => {
    if (!confirming || receivedProblem) return;
    try {
      setSaving(true);
      setError(null);
      const paid = await markOtaSettlementPaid(confirming.id, reference.trim() || undefined, receivedNumber);
      const s = paid?.settlement || {};
      const kept = Number(s.commission || 0);
      setNotice(
        `Recorded ${money(s.amount_received ?? receivedNumber)} from the OTA for ${confirming.reservation?.guest_name || "the guest"}` +
          (kept > 0 ? `; ${money(kept)} it kept as commission and fees is taken off the folio, so the guest doesn't owe it.` : "."),
      );
      setConfirming(null);
      setReference("");
      setReceived("");
      await load();
    } catch (err) {
      setError(err.message || "Failed to record the OTA payment.");
      setConfirming(null);
    } finally {
      setSaving(false);
    }
  };

  const pendingTotal = settlements.filter((s) => s.status === "pending").reduce((sum, s) => sum + Number(s.amount || 0), 0);

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeading icon={IoBusinessOutline} tipId="otaPayments.page">OTA Payments</PageHeading>
      <p className={`text-xl ${page.muted}`}>
        Nights an OTA is paying for instead of the guest. The folio keeps showing them as owing until the money arrives, and the
        guest is never asked for them. Marking one paid records the money that arrived against that folio; whatever the OTA kept is
        recorded as its commission and taken off the folio.
      </p>

      {error && <p className={`${field.error} w-full`}>{error}</p>}
      <Notice message={notice} onDismiss={() => setNotice(null)} />

      <div className="flex gap-3 flex-wrap">
        {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setStatus(tab.key)} className={status === tab.key ? btn.rowPrimary : btn.rowSecondary}>
              {tab.label}
            </button>
        ))}
      </div>

      {status === "pending" && !loading && settlements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 flex items-center justify-between gap-4 flex-wrap w-full">
          <span className="text-amber-800 font-bold text-xl">Total awaiting OTA payment:<Tip id="otaPayments.awaiting" /></span>
          <span className="text-amber-800 font-bold text-2xl">{money(pendingTotal)}</span>
        </div>
      )}

      <div className={table.card}>
        <div className={table.scroll}>
          {loading ? (
            <div className={table.empty}><LoadingSpinner /></div>
          ) : settlements.length === 0 ? (
            <p className={table.empty}>{status === "pending" ? "No OTA payments are outstanding." : "No OTA payments have been recorded yet."}</p>
          ) : (
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={`${table.th} ${table.stickyTh}`}>Guest<Tip id="otaPayments.col.guest" /></th>
                  <th className={table.th}>Booking Ref<Tip id="otaPayments.col.bookingRef" /></th>
                  <th className={table.th}>Nights Covered<Tip id="otaPayments.col.nights" /></th>
                  <th className={table.th}>Covers<Tip id="otaPayments.col.covers" /></th>
                  <th className={table.th}>Expected<Tip id="otaPayments.col.amount" /></th>
                  {status === "paid" && <th className={table.th}>Received<Tip id="otaPayments.col.received" /></th>}
                  {status === "paid" && <th className={table.th}>Commission<Tip id="otaPayments.col.commission" /></th>}
                  {status === "pending" && <th className={table.th}>Status<Tip id="otaPayments.col.status" /></th>}
                  <th className={table.th}>Action<Tip id="otaPayments.col.action" /></th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} className={table.row}>
                    <td className={`${table.td} ${table.stickyTd}`}>
                      <GuestName name={s.reservation?.guest_name || "—"} tags={s.reservation?.guest_tags} />
                    </td>
                    <td className={table.td}>{s.reservation?.booking_reference || "—"}</td>
                    <td className={table.td}>{s.start_date} to {s.end_date}</td>
                    <td className={table.td}>{s.includes_breakfast ? "Room and breakfast" : "Room only"}</td>
                    <td className={table.td}>{money(s.amount)}</td>
                    {status === "paid" && <td className={table.td}>{money(s.amount_received ?? s.amount)}</td>}
                    {status === "paid" && (
                      <td className={`${table.td} ${Number(s.commission) > 0 ? "font-semibold text-orange-700" : ""}`}>
                        {Number(s.commission) > 0 ? money(s.commission) : "-"}
                      </td>
                    )}
                    {status === "pending" && (
                      <td className={table.td}>
                        <StatusBadge status={s.status === "paid" ? "paid" : "owing"} />
                      </td>
                    )}
                    <td className={table.td}>
                      {s.status === "pending" ? (
                        <button
                          onClick={() => {
                            setConfirming(s);
                            setReference(s.reference || "");
                            setReceived(String(Number(s.amount || 0)));
                            setNotice(null);
                          }}
                          className={btn.rowSuccess}
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-(--text-color)/60">{s.reference || "Recorded"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirming && (
        <Modal
          onClose={() => setConfirming(null)}
          title="Record this OTA payment?"
          subtitle={`${confirming.reservation?.guest_name || "Guest"} · ${confirming.start_date} to ${confirming.end_date}`}
          size="sm"
          footer={
            <>
              <button onClick={() => setConfirming(null)} className={btn.secondary}>Cancel</button>
              <button onClick={confirmPaid} disabled={saving || Boolean(receivedProblem)} className={btn.success}>
                {saving ? "Recording..." : `Yes, ${money(receivedNumber || 0)} received`}
              </button>
            </>
          }
        >
          <p className={`text-xl ${page.muted}`}>
            The OTA was to pay {money(confirming.amount)} for these nights. Enter what actually arrived: it is recorded against the guest folio as
            money from the OTA. Only do it once the money has arrived.
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor="ota-received" className={field.label}>Amount received<Tip id="otaPayments.received" /></label>
            <input
              id="ota-received"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              className={field.input}
            />
            {receivedProblem ? (
              <p className={field.hint}>{receivedProblem}</p>
            ) : commission > 0 ? (
              <p className="text-lg text-orange-700">
                {money(commission)} less than expected: recorded as the OTA&apos;s commission and fees, and taken off the guest&apos;s folio so they don&apos;t owe it.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ota-reference" className={field.label}>OTA reference (optional)<Tip id="otaPayments.reference" /></label>
            <input
              id="ota-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="The remittance reference, if they gave one"
              className={field.input}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
