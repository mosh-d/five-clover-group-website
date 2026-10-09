"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/pms/Modal";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import { btn, field, page } from "@/components/pms/ui";
import { fetchStatement } from "@/lib/pms/api/accounting-api";
import { printDocument } from "@/lib/pms/print";

// A guest's statement of account (Accounting, Step 4; feature 13): the
// branch, the guest and stay, every charge and payment, and the balance -
// shown here, and printed on its own page (a document of its own in a hidden
// frame, so a long statement runs over as many sheets as it needs).

const naira = (v) => {
  const n = Number(v || 0);
  const s = `₦${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return n < 0 ? `-${s}` : s;
};
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }) : "-");
const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// The statement as a printable document of its own.
function statementHtml(s) {
  const rows = (lines) =>
    lines
      .map((l) => `<tr><td>${escape(day(l.date))}</td><td>${escape(l.description)}${l.reference ? ` <span class="muted">(${escape(l.reference)})</span>` : ""}</td><td class="num">${escape(naira(l.amount))}</td></tr>`)
      .join("");
  const payments = [...s.payments, ...(s.credit_line ? [{ date: null, description: s.credit_line.description, amount: s.credit_line.amount }] : [])];
  return `<!doctype html><html><head><meta charset="utf-8"><title>Statement ${escape(s.folio.folio_number)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; font-size: 13px; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 24px 0 8px; }
  .muted { color: #555; } .head { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111; padding-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; } td, th { padding: 6px 4px; border-bottom: 1px solid #ddd; text-align: left; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #555; } .num { text-align: right; white-space: nowrap; }
  .totals td { border: none; padding: 3px 4px; } .totals .big td { font-size: 16px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
</style></head><body>
<div class="head"><div><h1>${escape(s.branch.name)}</h1>
${s.branch.address ? `<div class="muted">${escape(s.branch.address)}</div>` : ""}
<div class="muted">${[s.branch.phone, s.branch.email].filter(Boolean).map(escape).join(" · ")}</div></div>
<div style="text-align:right"><h1>Statement of Account</h1><div class="muted">${escape(day(s.generated_at))}</div><div class="muted">Folio ${escape(s.folio.folio_number)}</div></div></div>
<h2>Guest</h2><div class="grid">
<div><b>${escape(s.guest.name)}</b></div><div>${s.stay.booking_reference ? `Booking ${escape(s.stay.booking_reference)}` : ""}</div>
<div class="muted">${[s.guest.phone, s.guest.email].filter(Boolean).map(escape).join(" · ")}</div>
<div class="muted">${[s.stay.room_type, s.stay.rooms ? `Room ${s.stay.rooms}` : null].filter(Boolean).map(escape).join(", ")}</div>
<div class="muted">${s.stay.is_no_show ? "No-show" : `Arrived ${escape(day(s.stay.arrived))}`}</div>
<div class="muted">${s.stay.left ? `Left ${escape(day(s.stay.left))}` : s.stay.booked_check_out ? `Due out ${escape(day(s.stay.booked_check_out))}` : ""}</div></div>
<h2>Charges</h2><table><thead><tr><th>Date</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>${rows(s.charges) || '<tr><td colspan="3" class="muted">None</td></tr>'}</tbody></table>
<h2>Payments</h2><table><thead><tr><th>Date</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>${rows(payments) || '<tr><td colspan="3" class="muted">None</td></tr>'}</tbody></table>
<h2>Summary</h2><table class="totals"><tbody>
<tr><td>Total charges</td><td class="num">${escape(naira(s.totals.charges))}</td></tr>
<tr><td>Total paid</td><td class="num">${escape(naira(s.totals.paid))}</td></tr>
${s.totals.ota_pending > 0 ? `<tr><td>To be paid by the booking site</td><td class="num">${escape(naira(s.totals.ota_pending))}</td></tr>` : ""}
<tr class="big"><td>${s.totals.guest_due >= 0 ? "Balance due" : "In credit"}</td><td class="num">${escape(naira(Math.abs(s.totals.guest_due)))}</td></tr>
</tbody></table>
</body></html>`;
}

const printStatement = (s) => printDocument(statementHtml(s));

export default function StatementDialog({ folioId, onClose }) {
  const [statement, setStatement] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchStatement(folioId)
      .then((s) => !cancelled && setStatement(s))
      .catch((err) => !cancelled && setError(err.message || "Could not load the statement."));
    return () => {
      cancelled = true;
    };
  }, [folioId]);

  const s = statement;
  const line = (l, i) => (
    <div key={i} className="flex justify-between gap-4 py-2 text-xl border-b border-(--accent-2) last:border-b-0">
      <span>
        <span className={page.muted}>{l.date ? day(l.date) : ""}</span> {l.description}
        {l.reference ? <span className={page.muted}> ({l.reference})</span> : null}
      </span>
      <span className={`whitespace-nowrap ${l.amount < 0 ? "text-red-600" : ""}`}>{naira(l.amount)}</span>
    </div>
  );

  return (
    <Modal
      onClose={onClose}
      title="Statement of Account"
      subtitle={s ? `${s.guest.name} · ${s.folio.folio_number}` : ""}
      size="lg"
      loading={!s && !error}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary}>Close</button>
          {s && <button type="button" onClick={() => printStatement(s)} className={btn.primary}>Print</button>}
        </>
      }
    >
      {error && <p className={field.error}>{error}</p>}
      {!s && !error && <LoadingSpinner size="lg" />}
      {s && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-bold">{s.branch.name}</p>
            {s.branch.address && <p className={`text-xl ${page.muted}`}>{s.branch.address}</p>}
            <p className={`text-xl ${page.muted}`}>{[s.branch.phone, s.branch.email].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex flex-col gap-1 text-xl">
            <p>
              <strong>{s.guest.name}</strong>
              {s.stay.booking_reference ? <span className={page.muted}> · Booking {s.stay.booking_reference}</span> : null}
            </p>
            <p className={page.muted}>{[s.guest.phone, s.guest.email].filter(Boolean).join(" · ")}</p>
            <p className={page.muted}>
              {[s.stay.room_type, s.stay.rooms ? `Room ${s.stay.rooms}` : null].filter(Boolean).join(", ")}
              {s.stay.is_no_show ? " · No-show" : ` · Arrived ${day(s.stay.arrived)}`}
              {s.stay.left ? ` · Left ${day(s.stay.left)}` : ""}
            </p>
          </div>
          <section className="flex flex-col">
            <h3 className="text-2xl font-bold text-(--black) mb-2">Charges</h3>
            {s.charges.length ? s.charges.map(line) : <p className={`text-xl ${page.muted}`}>None.</p>}
          </section>
          <section className="flex flex-col">
            <h3 className="text-2xl font-bold text-(--black) mb-2">Payments</h3>
            {s.payments.length || s.credit_line
              ? [...s.payments, ...(s.credit_line ? [{ description: s.credit_line.description, amount: s.credit_line.amount }] : [])].map(line)
              : <p className={`text-xl ${page.muted}`}>None.</p>}
          </section>
          <section className="flex flex-col text-xl">
            <div className="flex justify-between py-1"><span>Total charges</span><span>{naira(s.totals.charges)}</span></div>
            <div className="flex justify-between py-1"><span>Total paid</span><span>{naira(s.totals.paid)}</span></div>
            {s.totals.ota_pending > 0 && (
              <div className="flex justify-between py-1"><span>To be paid by the booking site</span><span>{naira(s.totals.ota_pending)}</span></div>
            )}
            <div className="flex justify-between py-2 mt-1 border-t-2 border-(--accent-2) text-2xl font-bold">
              <span>{s.totals.guest_due >= 0 ? "Balance due" : "In credit"}</span>
              <span>{naira(Math.abs(s.totals.guest_due))}</span>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
