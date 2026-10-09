"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import Pagination from "@/components/pms/Pagination";
import usePagedRows from "@/components/pms/usePagedRows";
import NonGuestCreditsPanel from "@/components/pms/NonGuestCreditsPanel";
import { Tip } from "@/components/pms/Tip";
import { AuditLink } from "@/components/pms/reportUi";
import { addDaysISO } from "@/lib/pms/dates";
import { auditFor } from "./audit";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDate, formatDateTime, money } from "@/lib/pms/format";
import { addReceivableNote, fetchReceivableNotes, fetchReceivables } from "@/lib/pms/api/accounting-api";
import { fetchPendingNonGuestCredits } from "@/lib/pms/api/non-guest-folios-api";
import StatementDialog from "./StatementDialog";

// Receivables (Accounting, Step 4): what is owed to the branch - guests in
// the house (the guest ledger), guests who left owing by how long ago (the
// city ledger), open non-guest bills - with the accountant's follow-up notes
// on each debt, a printable statement for a guest, and the non-guest credits
// the branch owes back, which the accountant can refund.

const ago = (days) => (days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`);

function NotesDialog({ debt, onClose, onAdded }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const target = debt.folio_id ? { folio_id: debt.folio_id } : { non_guest_folio_id: debt.non_guest_folio_id };
  const key = debt.folio_id ? `f${debt.folio_id}` : `n${debt.non_guest_folio_id}`;

  useEffect(() => {
    let cancelled = false;
    fetchReceivableNotes(debt.folio_id ? { folio_id: debt.folio_id } : { non_guest_folio_id: debt.non_guest_folio_id })
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message || "Could not load the notes."));
    return () => {
      cancelled = true;
    };
  }, [key, debt.folio_id, debt.non_guest_folio_id]);

  const save = async () => {
    try {
      setBusy(true);
      setSaveError(null);
      await addReceivableNote(target, note.trim());
      onAdded(`Noted on ${data?.debt || "the bill"}.`);
    } catch (err) {
      setSaveError(err.message || "Could not save the note.");
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={busy ? undefined : onClose}
      title="Follow-Up Notes"
      subtitle={data?.debt || ""}
      size="md"
      loading={!data && !error}
      footer={
        !confirming && (
          <>
            <button type="button" onClick={onClose} className={btn.secondary}>Close</button>
            <button type="button" onClick={() => setConfirming(true)} disabled={!note.trim()} className={btn.primary}>Add note</button>
          </>
        )
      }
    >
      {error && <p className={field.error}>{error}</p>}
      {!data && !error && <LoadingSpinner size="lg" />}
      {data && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="receivable-note" className={field.label}>
              New Note
              <Tip id="accounting.receivables.note" />
            </label>
            <AutoGrowTextarea
              id="receivable-note"
              value={note}
              maxLength={500}
              placeholder="e.g. Called, promised to pay Friday"
              onChange={(e) => setNote(e.target.value)}
              className={field.textarea}
              disabled={busy || confirming}
            />
          </div>
          {confirming && (
            <ConfirmPanel
              question={`Add this note to ${data.debt}?`}
              details={[`"${note.trim()}"`, "It is kept with today's date and your name, and shows in the Audit Trail."]}
              confirmLabel="Yes, add it"
              busyLabel="Saving..."
              busy={busy}
              error={saveError}
              onBack={() => {
                setConfirming(false);
                setSaveError(null);
              }}
              onConfirm={save}
            />
          )}
          <section className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold text-(--black)">Earlier Notes<Tip id="accounting.receivables.notes" /></h3>
            {data.notes.length === 0 ? (
              <p className={`text-xl ${page.muted}`}>No notes yet.</p>
            ) : (
              data.notes.map((n) => (
                <div key={n.id} className="flex flex-col py-2 border-b border-(--accent-2) last:border-b-0">
                  <span className="text-xl">{n.note}</span>
                  <span className={`text-lg ${page.muted}`}>{n.by || "A former account"}, {formatDateTime(n.at)}</span>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

// The latest note on a debt, in the list.
function LatestNote({ note }) {
  if (!note) return <span className={page.muted}>-</span>;
  return (
    <div className="flex flex-col whitespace-normal min-w-[12rem] max-w-[22rem]">
      <span>{note.note}</span>
      <span className={`text-lg ${page.muted}`}>{note.by || "A former account"}, {formatDate(note.at)}</span>
    </div>
  );
}

function LastPayment({ payment }) {
  if (!payment) return <span className={page.muted}>None</span>;
  return (
    <div className="flex flex-col">
      <span>{money(payment.amount)}</span>
      <span className={`text-lg ${page.muted}`}>{payment.method}, {formatDate(payment.at)}</span>
    </div>
  );
}

function BucketChips({ buckets, active, onPick }) {
  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => onPick(null)} className={`px-4 py-2 rounded-lg text-xl cursor-pointer ${active === null ? "bg-(--emphasis) text-white font-bold" : "bg-black/5"}`}>
        All
      </button>
      {buckets.map((b) => (
        <button
          key={b.bucket}
          type="button"
          onClick={() => onPick(b.bucket)}
          className={`px-4 py-2 rounded-lg text-xl cursor-pointer ${active === b.bucket ? "bg-(--emphasis) text-white font-bold" : "bg-black/5"}`}
        >
          {b.label}: {b.count}{b.count ? ` · ${money(b.amount)}` : ""}
        </button>
      ))}
    </div>
  );
}

// Every debt as a spreadsheet.
function downloadCsv(view) {
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Ledger", "Name", "Phone", "Bill", "Since", "Days", "Age", "Owes", "Last payment", "Last payment date", "Latest note"]];
  for (const g of view.guest_ledger) lines.push(["In house", g.guest_name, g.phone, g.folio_number, g.check_in, "", "", g.guest_due, g.last_payment?.amount ?? "", g.last_payment?.at ?? "", g.latest_note?.note ?? ""]);
  for (const c of view.city_ledger) lines.push(["Left owing", c.guest_name, c.phone, c.folio_number, c.owed_since, c.days, c.bucket, c.guest_due, c.last_payment?.amount ?? "", c.last_payment?.at ?? "", c.latest_note?.note ?? ""]);
  for (const n of view.non_guest_debts) lines.push(["Non-guest", n.guest_name || "Unnamed", n.phone, n.folio_number, n.owed_since, n.days, n.bucket, n.balance, n.last_payment?.amount ?? "", n.last_payment?.at ?? "", n.latest_note?.note ?? ""]);
  const blob = new Blob([lines.map((l) => l.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receivables_${view.today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReceivablesTab() {
  const router = useRouter();
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [bucket, setBucket] = useState(null);
  const [ngBucket, setNgBucket] = useState(null);
  const [notesFor, setNotesFor] = useState(null);
  const [statementFor, setStatementFor] = useState(null);
  const [credits, setCredits] = useState([]);

  const loadCredits = useCallback(
    () =>
      fetchPendingNonGuestCredits().then(
        (c) => setCredits(Array.isArray(c) ? c : []),
        () => setCredits([]),
      ),
    [],
  );
  const load = useCallback(
    () =>
      Promise.all([
        fetchReceivables().then(
          (d) => {
            setView(d);
            setError(null);
          },
          (err) => setError(err.message || "Could not load what is owed."),
        ),
        loadCredits(),
      ]),
    [loadCredits],
  );

  useEffect(() => {
    let cancelled = false;
    fetchReceivables().then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load what is owed."),
    );
    fetchPendingNonGuestCredits().then(
      (c) => !cancelled && setCredits(Array.isArray(c) ? c : []),
      () => !cancelled && setCredits([]),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  useLiveRefresh(load, []);

  const city = (view?.city_ledger || []).filter((c) => !bucket || c.bucket === bucket);
  const cityPage = usePagedRows(city);
  const housePage = usePagedRows(view?.guest_ledger || []);
  const nonGuest = (view?.non_guest_debts || []).filter((n) => !ngBucket || n.bucket === ngBucket);
  const ngPage = usePagedRows(nonGuest);

  // A guest's stay from the day before it began (a booked date is a calendar
  // day), a non-guest bill from when it was opened - both to today.
  const auditOf = (row) =>
    row.folio_id
      ? auditFor({ search: row.guest_name || row.folio_number, from: addDaysISO(String(row.check_in || view.today).slice(0, 10), -1), to: view.today })
      : auditFor({ search: row.guest_name || row.folio_number, from: row.owed_since, to: view.today });
  const actions = (row, { statement = true } = {}) => (
    <div className={table.actions}>
      <button type="button" onClick={() => setNotesFor(row)} className={btn.rowSecondary}>Notes</button>
      {statement && row.folio_id && (
        <>
          <button type="button" onClick={() => setStatementFor(row.folio_id)} className={btn.rowSecondary}>Statement</button>
          <button type="button" onClick={() => router.push(`/pms/folios?folio_id=${row.folio_id}`)} className={btn.rowPrimary}>Folio</button>
        </>
      )}
      <AuditLink audit={auditOf(row)} />
    </div>
  );
  const guestCell = (g) => (
    <div className="flex flex-col">
      <span className="font-semibold">{g.guest_name}</span>
      <span className={`text-lg ${page.muted}`}>{[g.folio_number, g.phone].filter(Boolean).join(" · ")}</span>
      {g.is_no_show && <span className="text-lg text-orange-600 font-semibold">No-show</span>}
    </div>
  );

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Receivables
          <Tip id="accounting.receivables" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          What is owed to the branch: by guests in the house, by guests who left owing, and on non-guest bills. Note each follow-up, and print a statement for a guest.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!view && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        view && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>Left owing</strong>: {money(view.totals.city_ledger)}</span>
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>In house</strong>: {money(view.totals.guest_ledger)}</span>
              <span className="px-4 py-2 rounded-lg text-xl bg-black/5"><strong>Non-guest bills</strong>: {money(view.totals.non_guest)}</span>
              <Tip id="accounting.receivables.totals" />
              <button type="button" onClick={() => downloadCsv(view)} className={btn.secondary}>Download CSV</button>
            </div>

            {/* ---- City ledger */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">Left Owing<Tip id="accounting.receivables.city" /></h3>
              <BucketChips buckets={view.city_buckets} active={bucket} onPick={(b) => { setBucket(b); cityPage.setPage(1); }} />
              {city.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>Nobody who left owes anything{bucket ? " in this age band" : ""}.</p>
              ) : (
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          <th className={`${table.th} ${table.stickyTh}`}>Guest<Tip id="accounting.receivables.col.guest" /></th>
                          <th className={table.th}>Left<Tip id="accounting.receivables.col.left" /></th>
                          <th className={`${table.th} text-right!`}>Owes<Tip id="accounting.receivables.col.owes" /></th>
                          <th className={`${table.th} hidden md:table-cell`}>Last Payment<Tip id="accounting.receivables.col.lastPayment" /></th>
                          <th className={`${table.th} hidden lg:table-cell`}>Latest Note<Tip id="accounting.receivables.col.note" /></th>
                          <th className={table.th}>Actions<Tip id="accounting.receivables.col.actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cityPage.rows.map((c) => (
                          <tr key={c.folio_id} className={table.row}>
                            <td className={`${table.td} ${table.stickyTd}`}>{guestCell(c)}</td>
                            <td className={table.td}>
                              <div>{formatDate(`${c.owed_since}T12:00:00Z`)}</div>
                              <div className={`text-lg ${c.days > 30 ? "text-red-600 font-semibold" : page.muted}`}>{ago(c.days)}</div>
                            </td>
                            <td className={`${table.td} text-right! font-bold text-red-600`}>{money(c.guest_due)}</td>
                            <td className={`${table.td} hidden md:table-cell`}><LastPayment payment={c.last_payment} /></td>
                            <td className={`${table.td} hidden lg:table-cell`}><LatestNote note={c.latest_note} /></td>
                            <td className={table.td}>{actions(c)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <Pagination page={cityPage.page} totalPages={cityPage.totalPages} onPage={cityPage.setPage} className="mt-0" />
            </section>

            {/* ---- Guest ledger */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">In House<Tip id="accounting.receivables.house" /></h3>
              {view.guest_ledger.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>Nobody in the house owes anything.</p>
              ) : (
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          <th className={`${table.th} ${table.stickyTh}`}>Guest<Tip id="accounting.receivables.col.guest" /></th>
                          <th className={`${table.th} hidden md:table-cell`}>Room<Tip id="accounting.receivables.col.room" /></th>
                          <th className={`${table.th} hidden md:table-cell`}>Due Out<Tip id="accounting.receivables.col.dueOut" /></th>
                          <th className={`${table.th} text-right!`}>Owes Now<Tip id="accounting.receivables.col.owesNow" /></th>
                          <th className={`${table.th} hidden lg:table-cell`}>Latest Note<Tip id="accounting.receivables.col.note" /></th>
                          <th className={table.th}>Actions<Tip id="accounting.receivables.col.actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {housePage.rows.map((g) => (
                          <tr key={g.folio_id} className={table.row}>
                            <td className={`${table.td} ${table.stickyTd}`}>{guestCell(g)}</td>
                            <td className={`${table.td} hidden md:table-cell`}>{g.rooms || "-"}</td>
                            <td className={`${table.td} hidden md:table-cell`}>{formatDate(g.check_out)}</td>
                            <td className={`${table.td} text-right! font-bold text-red-600`}>{money(g.guest_due)}</td>
                            <td className={`${table.td} hidden lg:table-cell`}><LatestNote note={g.latest_note} /></td>
                            <td className={table.td}>{actions(g)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <Pagination page={housePage.page} totalPages={housePage.totalPages} onPage={housePage.setPage} className="mt-0" />
              {view.in_house_settled > 0 && (
                <p className={`text-xl ${page.muted}`}>
                  {view.in_house_settled} {view.guest_ledger.length > 0 ? "more " : ""}guest{view.in_house_settled === 1 ? " is" : "s are"} in the house owing nothing.
                </p>
              )}
            </section>

            {/* ---- Non-guest debts */}
            <section className="w-full flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-(--black)">Non-Guest Bills<Tip id="accounting.receivables.nonGuest" /></h3>
              <BucketChips buckets={view.non_guest_buckets} active={ngBucket} onPick={(b) => { setNgBucket(b); ngPage.setPage(1); }} />
              {nonGuest.length === 0 ? (
                <p className={`text-xl ${page.muted}`}>No open non-guest bill owes anything{ngBucket ? " in this age band" : ""}.</p>
              ) : (
                <div className={table.card}>
                  <div className={table.scroll}>
                    <table className={table.el}>
                      <thead>
                        <tr className={table.headRow}>
                          <th className={`${table.th} ${table.stickyTh}`}>Bill<Tip id="accounting.receivables.col.bill" /></th>
                          <th className={table.th}>Opened<Tip id="accounting.receivables.col.opened" /></th>
                          <th className={`${table.th} text-right!`}>Owes<Tip id="accounting.receivables.col.owes" /></th>
                          <th className={`${table.th} hidden md:table-cell`}>Last Payment<Tip id="accounting.receivables.col.lastPayment" /></th>
                          <th className={`${table.th} hidden lg:table-cell`}>Latest Note<Tip id="accounting.receivables.col.note" /></th>
                          <th className={table.th}>Actions<Tip id="accounting.receivables.col.actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ngPage.rows.map((n) => (
                          <tr key={n.non_guest_folio_id} className={table.row}>
                            <td className={`${table.td} ${table.stickyTd}`}>
                              <div className="flex flex-col">
                                <span className="font-semibold">{n.guest_name || "Unnamed"}</span>
                                <span className={`text-lg ${page.muted}`}>{[n.folio_number, n.service, n.phone].filter(Boolean).join(" · ")}</span>
                              </div>
                            </td>
                            <td className={table.td}>
                              <div>{formatDate(`${n.owed_since}T12:00:00Z`)}</div>
                              <div className={`text-lg ${n.days > 30 ? "text-red-600 font-semibold" : page.muted}`}>{ago(n.days)}</div>
                            </td>
                            <td className={`${table.td} text-right! font-bold text-red-600`}>{money(n.balance)}</td>
                            <td className={`${table.td} hidden md:table-cell`}><LastPayment payment={n.last_payment} /></td>
                            <td className={`${table.td} hidden lg:table-cell`}><LatestNote note={n.latest_note} /></td>
                            <td className={table.td}>{actions(n, { statement: false })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <Pagination page={ngPage.page} totalPages={ngPage.totalPages} onPage={ngPage.setPage} className="mt-0" />
            </section>

            {/* ---- What the branch owes back to non-guests */}
            <NonGuestCreditsPanel credits={credits} onRefunded={loadCredits} auditTo={view.today} />
          </>
        )
      )}

      {notesFor && (
        <NotesDialog
          debt={notesFor}
          onClose={() => setNotesFor(null)}
          onAdded={(message) => {
            setNotesFor(null);
            setNotice(message);
            load();
          }}
        />
      )}
      {statementFor && <StatementDialog folioId={statementFor} onClose={() => setStatementFor(null)} />}
    </section>
  );
}
