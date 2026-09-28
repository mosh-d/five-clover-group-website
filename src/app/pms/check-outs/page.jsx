"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoLogOutOutline } from "react-icons/io5";
import PageHeading from "@/components/admin/PageHeading";
import Modal from "@/components/pms/Modal";
import DateInput from "@/components/pms/DateInput";
import GuestName from "@/components/pms/GuestName";
import Toast from "@/components/pms/Toast";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { fetchFolios } from "@/lib/pms/api/folios-api";
import { fetchCheckOutList } from "@/lib/pms/api/front-office-api";
import { checkOutReservation, shortenStayToDeparture } from "@/lib/pms/api/reservations-pms-api";
import { todayISO, hasPassedNoonCutoff } from "@/lib/pms/dates";
import { formatDate, money } from "@/lib/pms/format";

// Whether this stay's scheduled checkout has actually come due (noon Lagos
// on check_out) - the date can be browsed forward, so a listed stay isn't
// necessarily due yet. Labels the row button only; what the dialog offers
// is decided by departsEarly, the one with billing consequences.
const isCheckoutDue = (checkOut) => checkOut && hasPassedNoonCutoff(checkOut);

// Whether the booked check_out is still ahead - the guest is leaving early
// and the reservation still says otherwise. This matters for money: a
// checkout bills the BOOKED last night, so leaving it wrong bills a night the
// guest never reached (and before 6am leaves the night they did sleep
// unbilled). Correcting the date first makes an ordinary checkout bill
// exactly what was slept.
//
// Judged against what a departure right now bills to, which the server works
// out per row (departure_check_out) - never against today's date: someone
// arriving and leaving the same business day is correctly booked to end
// TOMORROW, one night being the minimum (2026-09-27). Today's date is only a
// fallback for an older server.
const departsEarly = (reservation, today) => {
  const checkOut = reservation?.check_out;
  if (!checkOut) return false;
  const booked = String(checkOut).slice(0, 10);
  if (reservation.departure_check_out) return booked > String(reservation.departure_check_out).slice(0, 10);
  return booked > today;
};

// Check-Out List - the branch PMS's page (AdminCheckOuts.jsx).
export default function PmsCheckOutsPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");
  const clearToast = useCallback(() => setToast(""), []);

  const [selected, setSelected] = useState(null);
  const [folio, setFolio] = useState(null);
  const [folioLoading, setFolioLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adjustingDate, setAdjustingDate] = useState(false);
  // Shown INSIDE the dialog - an error on the page behind it would be
  // invisible and the button would look dead (owner, 2026-09-27).
  const [adjustError, setAdjustError] = useState("");

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchCheckOutList(date);
      setList(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      setError(`${err.message || "Failed to load check-out list."} Please refresh the page.`);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadList();
  }, [loadList]);
  useLiveRefresh(loadList, ["reservations"]);

  const openCheckOut = async (reservation) => {
    setSelected(reservation);
    setAdjustError("");
    setFolio(null);
    setFolioLoading(true);
    try {
      const result = await fetchFolios({ reservation_id: reservation.id });
      setFolio(result?.data?.[0] || null);
    } catch {
      setFolio(null);
    } finally {
      setFolioLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selected) return;
    try {
      setProcessing(true);
      await checkOutReservation(selected.id);
      setToast(`${selected.guest_name} checked out.`);
      setSelected(null);
      loadList();
    } catch (err) {
      setError(err.message || "Failed to check out.");
    } finally {
      setProcessing(false);
    }
  };

  // Moves check_out to the night the guest is actually leaving on - worked
  // out by the server - so the checkout below bills the right night.
  const handleAdjustDate = async () => {
    if (!selected) return;
    try {
      setAdjustingDate(true);
      setAdjustError("");
      const updated = await shortenStayToDeparture(selected.id);
      setSelected((p) => ({ ...p, check_out: updated.check_out, total_rate: updated.total_rate }));
      setToast("Checkout date corrected to today — the stay now bills only the nights actually slept.");
      loadList();
    } catch (err) {
      setAdjustError(err.message || "Failed to adjust the checkout date.");
    } finally {
      setAdjustingDate(false);
    }
  };

  const balanceDue = folio && Number(folio.balance) > 0;
  const selectedDepartsEarly = selected && departsEarly(selected, todayISO());

  return (
    <>
      <Toast message={toast} onClose={clearToast} />

      <div className={`${page.wrap} gap-[3rem]!`}>
        <div className="flex flex-col items-start gap-4">
          <PageHeading icon={IoLogOutOutline}>Check-Out List</PageHeading>
          <DateInput value={date} onChange={(e) => setDate(e.target.value)} className={`${field.input} w-auto! text-xl!`} aria-label="Departure date" />
        </div>

        <div className={table.card}>
          <div className={table.scroll}>
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={`${table.th} ${table.stickyTh}`}>Guest</th>
                  <th className={`${table.th} hidden md:table-cell`}>Room Type</th>
                  <th className={`${table.th} hidden md:table-cell`}>Checked In</th>
                  <th className={table.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className={table.empty}>Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan="4" className={`${table.empty} text-red-600!`}>{error}</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan="4" className={table.empty}>No expected check-outs for this date.</td></tr>
                ) : (
                  list.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd} font-medium`}><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
                      <td className={`${table.td} hidden md:table-cell`}>{r.room_type?.name || "N/A"}</td>
                      <td className={`${table.td} hidden md:table-cell`}>{formatDate(r.actual_check_in)}</td>
                      <td className={table.td}>
                        <div className={table.actions}>
                          <button onClick={() => openCheckOut(r)} className={isCheckoutDue(r.check_out) ? btn.rowPrimary : btn.rowDanger}>
                            {isCheckoutDue(r.check_out) ? "Check Out" : "Early Departure"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <Modal
          onClose={() => setSelected(null)}
          title={<GuestName name={selectedDepartsEarly ? `Early Departure — ${selected.guest_name}` : selected.guest_name} tags={selected.guest_tags} />}
          subtitle={
            selectedDepartsEarly
              ? "Their booked check-out is still ahead — correct the date first so the bill matches the nights actually slept."
              : "Review the folio balance before completing check-out."
          }
          size="sm"
          footer={
            <>
              <button onClick={() => setSelected(null)} className={btn.secondary}>Cancel</button>
              {selectedDepartsEarly ? (
                <button onClick={handleAdjustDate} disabled={adjustingDate || processing} className={btn.primary}>
                  {adjustingDate ? "Adjusting..." : "Set Checkout Date to Today"}
                </button>
              ) : (
                <button onClick={handleCheckOut} disabled={processing} className={btn.success}>
                  {processing ? "Checking Out..." : "Confirm Check Out"}
                </button>
              )}
            </>
          }
        >
          {adjustError && <p className={`${field.error} w-full`}>{adjustError}</p>}
          {selectedDepartsEarly && (
            <div className="text-xl text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex flex-col gap-2">
              <p>
                Booked to leave <strong>{formatDate(selected.check_out)}</strong>, but leaving now. Checking out against the booked date
                would bill a night they never stayed — and before 6am it would also leave last night unbilled.
              </p>
              <p>Setting the date to today re-prices the stay to the nights actually slept, and unlocks Check Out.</p>
            </div>
          )}
          {folioLoading ? (
            <p className={`text-xl ${page.muted}`}>Loading…</p>
          ) : folio ? (
            <div
              className={`flex justify-between items-center text-xl px-5 py-4 rounded-lg border ${
                balanceDue ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <span className="font-bold">Folio Balance</span>
              <span className="font-bold text-2xl">{money(folio.balance)}</span>
            </div>
          ) : (
            <p className={`text-xl ${page.muted}`}>No folio found for this reservation.</p>
          )}
          {balanceDue && (
            <div className="flex flex-col gap-3">
              <p className="text-xl text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-5 py-4">
                ⚠ Outstanding balance — consider settling payment before checkout.
              </p>
              <button type="button" onClick={() => router.push(`/pms/folios?reservation_id=${selected.id}`)} className={`${btn.secondary} self-start`}>
                Go to Folio to Record Payment
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
