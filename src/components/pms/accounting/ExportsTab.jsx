"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import DateInput from "@/components/pms/DateInput";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Notice from "@/components/pms/Notice";
import { Tip } from "@/components/pms/Tip";
import { AuditLink } from "@/components/pms/reportUi";
import { auditFor } from "./audit";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { money } from "@/lib/pms/format";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { downloadJournal, fetchAccounts, fetchJournal, saveAccounts } from "@/lib/pms/api/accounting-api";

// Exports (Accounting, Step 10): the branch's account codes - each thing the
// journal posts to, with its code and name in the branch's own books - and
// the journal: one balanced entry a business day, as a CSV for QuickBooks,
// Sage or Excel. Setting codes is asked twice and recorded in the Audit Trail.

const GROUPS = [
  { key: "money", label: "Money In and Out" },
  { key: "owed", label: "Owed and Held" },
  { key: "revenue", label: "Revenue" },
  { key: "expenses", label: "Expenses" },
];

const dayText = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(",", "");
const clean = (v) => String(v ?? "").trim();

// A change in words, as the server writes it to the Audit Trail.
const describe = (a, d) => {
  const parts = [];
  const code = clean(d.code) || null;
  const name = clean(d.name) || a.plain_name;
  if (code !== (a.code || null)) parts.push(`code ${code || "none"} (was ${a.code || "none"})`);
  if (name !== a.name) parts.push(`named "${name}" (was "${a.name}")`);
  return `${a.plain_name}: ${parts.join(", ")}`;
};

function AccountCodes({ onSaved }) {
  const [accounts, setAccounts] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [notice, setNotice] = useState(null);

  const take = (list) => {
    setAccounts(list);
    setDrafts(Object.fromEntries(list.map((a) => [a.key, { code: a.code || "", name: a.name }])));
  };
  useEffect(() => {
    let cancelled = false;
    fetchAccounts().then(
      (list) => !cancelled && take(list),
      (err) => !cancelled && setError(err.message || "Could not load the account codes."),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const changed = useMemo(
    () =>
      (accounts || []).filter((a) => {
        const d = drafts[a.key];
        if (!d) return false;
        return (clean(d.code) || null) !== (a.code || null) || (clean(d.name) || a.plain_name) !== a.name;
      }),
    [accounts, drafts],
  );
  const edit = (key, part, value) => {
    setDrafts((all) => ({ ...all, [key]: { ...all[key], [part]: value } }));
    setNotice(null);
  };
  const save = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      const result = await saveAccounts(changed.map((a) => ({ key: a.key, code: clean(drafts[a.key].code), name: clean(drafts[a.key].name) })));
      take(result.accounts);
      setConfirming(false);
      setNotice(`Saved ${result.changed} account ${result.changed === 1 ? "code" : "codes"}. The journal uses them from now on.`);
      onSaved();
    } catch (err) {
      setSaveError(err.message || "Could not save the account codes.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-(--black)">Account Codes<Tip id="accounting.exports.accounts" /></h3>
        <p className={`text-xl ${page.muted}`}>
          The code and name each one has in your books. Set them once; an account with no code still downloads, with the code left empty.
        </p>
      </div>
      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}
      {!accounts && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        accounts && (
          <>
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Account<Tip id="accounting.exports.col.account" /></th>
                      <th className={table.th}>Code<Tip id="accounting.exports.col.code" /></th>
                      <th className={table.th}>Name in Your Books<Tip id="accounting.exports.col.name" /></th>
                      <th className={table.th}>Action<Tip id="accounting.exports.col.accountLog" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {GROUPS.map((g) => (
                      <Fragment key={g.key}>
                        <tr className={table.headRow}>
                          <th scope="colgroup" colSpan={4} className="px-8 py-3 text-left text-xl font-bold text-(--black)">{g.label}</th>
                        </tr>
                        {accounts
                          .filter((a) => a.group === g.key)
                          .map((a) => (
                            <tr key={a.key} className={table.row}>
                              <td className={`${table.td} ${table.stickyTd}`}>
                                <div>{a.plain_name}</div>
                                {a.source === "group" && <div className={`text-lg ${page.muted}`}>the group&apos;s default</div>}
                              </td>
                              <td className={table.td}>
                                <input
                                  aria-label={`Code for ${a.plain_name}`}
                                  value={drafts[a.key]?.code ?? ""}
                                  onChange={(e) => edit(a.key, "code", e.target.value)}
                                  maxLength={40}
                                  className={`${field.input} w-40!`}
                                  disabled={busy || confirming}
                                />
                              </td>
                              <td className={table.td}>
                                <input
                                  aria-label={`Name in your books for ${a.plain_name}`}
                                  value={drafts[a.key]?.name ?? ""}
                                  onChange={(e) => edit(a.key, "name", e.target.value)}
                                  maxLength={120}
                                  placeholder={a.plain_name}
                                  className={`${field.input} min-w-[18rem]`}
                                  disabled={busy || confirming}
                                />
                              </td>
                              <td className={table.td}>
                                {/* Every change to this account's code or name, whenever made. */}
                                <AuditLink audit={auditFor({ search: `${a.plain_name}:` })} />
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {confirming ? (
              <ConfirmPanel
                question={`Save ${changed.length} account ${changed.length === 1 ? "code" : "codes"}?`}
                details={[...changed.map((a) => describe(a, drafts[a.key])), "The journal uses them from the next download. Recorded in the Audit Trail under your name."]}
                confirmLabel="Yes, save them"
                busyLabel="Saving..."
                busy={busy}
                error={saveError}
                onBack={() => {
                  setConfirming(false);
                  setSaveError(null);
                }}
                onConfirm={save}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setConfirming(true)} disabled={changed.length === 0} className={btn.primary}>
                  Save Account Codes
                </button>
                {changed.length > 0 && (
                  <>
                    <button type="button" onClick={() => take(accounts)} className={btn.secondary}>Undo Changes</button>
                    <span className={`text-xl ${page.muted}`}>{changed.length} changed</span>
                  </>
                )}
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}

export default function ExportsTab() {
  const today = businessDateISO();
  const [from, setFrom] = useState(() => `${businessDateISO().slice(0, 7)}-01`);
  const [to, setTo] = useState(() => businessDateISO());
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const ready = Boolean(from && to && to >= from);

  const load = useCallback(
    () =>
      ready
        ? fetchJournal(from, to).then(
            (d) => {
              setView(d);
              setError(null);
            },
            (err) => setError(err.message || "Could not load the journal."),
          )
        : Promise.resolve(),
    [from, to, ready],
  );
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    fetchJournal(from, to).then(
      (d) => {
        if (cancelled) return;
        setView(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the journal."),
    );
    return () => {
      cancelled = true;
    };
  }, [from, to, ready, reloadTick]);
  useLiveRefresh(load, []);

  const pick = (f, t) => {
    setFrom(f);
    setTo(t);
    setOpenDay(null);
  };
  const lastMonthEnd = addDaysISO(`${today.slice(0, 7)}-01`, -1);
  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadJournal(from, to);
    } catch (err) {
      setDownloadError(err.message || "Could not download the journal.");
    } finally {
      setDownloading(false);
    }
  };

  // Dates just picked show the spinner until their journal arrives.
  const shown = view && view.from === from && view.to === to ? view : null;
  const day = shown?.days.find((d) => d.date === openDay) || null;
  const posted = shown ? shown.days.filter((d) => d.lines.length > 0) : [];

  return (
    <section className="w-full flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h2 className={page.sectionTitle}>
          Exports
          <Tip id="accounting.exports" />
        </h2>
        <p className={`text-xl ${page.muted}`}>
          The journal for your books: each business day as one entry of double entries, as a CSV for QuickBooks, Sage or Excel - with the account codes it uses.
        </p>
      </div>

      {/* ---- The journal */}
      <section className="w-full flex flex-col gap-4">
        <h3 className="text-2xl font-bold text-(--black)">Journal<Tip id="accounting.exports.journal" /></h3>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="journal-from" className={field.label}>From<Tip id="accounting.exports.from" /></label>
            <DateInput id="journal-from" value={from} max={to || today} onChange={(e) => pick(e.target.value, to)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="journal-to" className={field.label}>To<Tip id="accounting.exports.to" /></label>
            <DateInput id="journal-to" value={to} min={from} max={today} onChange={(e) => pick(from, e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => pick(addDaysISO(today, -1), addDaysISO(today, -1))} className={btn.secondary}>Yesterday</button>
            <button type="button" onClick={() => pick(`${today.slice(0, 7)}-01`, today)} className={btn.secondary}>This Month</button>
            <button type="button" onClick={() => pick(`${lastMonthEnd.slice(0, 7)}-01`, lastMonthEnd)} className={btn.secondary}>Last Month</button>
          </div>
        </div>

        {error && <p className={`${field.error} w-full`}>{error}</p>}
        {downloadError && <p className={`${field.error} w-full`}>{downloadError}</p>}

        {!ready ? (
          <p className={`text-xl ${page.muted}`}>Pick the days for the journal.</p>
        ) : !shown && !error ? (
          <div className="flex justify-center py-10 w-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          shown && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-2 rounded-lg text-xl bg-black/5">
                  <strong>{posted.length}</strong> {posted.length === 1 ? "entry" : "entries"} · {posted.reduce((s, d) => s + d.lines.length, 0)} lines
                </span>
                <span className={`px-4 py-2 rounded-lg text-xl ${shown.totals.debit === shown.totals.credit ? "bg-green-50 text-green-800" : "bg-red-100 text-red-700"}`}>
                  <strong>Debits</strong> {money(shown.totals.debit)} {shown.totals.debit === shown.totals.credit ? "=" : "≠"} <strong>Credits</strong> {money(shown.totals.credit)}
                </span>
                <Tip id="accounting.exports.totals" />
                <button type="button" onClick={download} disabled={downloading || posted.length === 0} className={btn.secondary}>
                  {downloading ? "Downloading..." : "Download CSV"}
                </button>
              </div>
              {shown.no_code.length > 0 && (
                <p className="text-xl text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  {shown.no_code.length === 1 ? "One account" : `${shown.no_code.length} accounts`} this journal posts to {shown.no_code.length === 1 ? "has" : "have"} no code yet:{" "}
                  {shown.no_code.map((a) => a.name).join(", ")}. The file still downloads, with the code left empty - set the codes below.
                  <Tip id="accounting.exports.noCode" />
                </p>
              )}

              <div className={table.card}>
                <div className={table.scroll}>
                  <table className={table.el}>
                    <thead>
                      <tr className={table.headRow}>
                        <th className={`${table.th} ${table.stickyTh}`}>Day<Tip id="accounting.exports.col.day" /></th>
                        <th className={`${table.th} hidden md:table-cell`}>Entry<Tip id="accounting.exports.col.journalNo" /></th>
                        <th className={`${table.th} text-right!`}>Lines<Tip id="accounting.exports.col.lines" /></th>
                        <th className={`${table.th} text-right!`}>Debits<Tip id="accounting.exports.col.debits" /></th>
                        <th className={`${table.th} text-right! hidden md:table-cell`}>Credits<Tip id="accounting.exports.col.credits" /></th>
                        <th className={table.th}>Actions<Tip id="accounting.exports.col.actions" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.days.map((d) => (
                        <tr key={d.date} className={table.row}>
                          <td className={`${table.td} ${table.stickyTd}`}>
                            {dayText(d.date)}
                            {d.date === shown.today && <span className={`text-lg ${page.muted}`}> (so far)</span>}
                          </td>
                          <td className={`${table.td} hidden md:table-cell font-mono text-xl`}>{d.lines.length ? d.journal_no : "-"}</td>
                          <td className={`${table.td} text-right!`}>{d.lines.length || "-"}</td>
                          <td className={`${table.td} text-right!`}>{d.lines.length ? money(d.debit) : "-"}</td>
                          <td className={`${table.td} text-right! hidden md:table-cell ${d.debit !== d.credit ? "text-red-600 font-bold" : ""}`}>{d.lines.length ? money(d.credit) : "-"}</td>
                          <td className={table.td}>
                            <div className={table.actions}>
                              {d.lines.length > 0 && (
                                <button type="button" onClick={() => setOpenDay(openDay === d.date ? null : d.date)} className={btn.rowSecondary}>
                                  {openDay === d.date ? "Hide" : "View"}
                                </button>
                              )}
                              <AuditLink audit={auditFor({ from: d.date })} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {day && (
                <div className="w-full flex flex-col gap-3">
                  <h4 className="text-xl font-bold text-(--black)">
                    {day.journal_no} - {dayText(day.date)}
                    <Tip id="accounting.exports.entry" />
                  </h4>
                  <div className={table.card}>
                    <div className={table.scroll}>
                      <table className={table.el}>
                        <thead>
                          <tr className={table.headRow}>
                            <th className={`${table.th} ${table.stickyTh}`}>Account<Tip id="accounting.exports.lines.col.account" /></th>
                            <th className={table.th}>Description<Tip id="accounting.exports.lines.col.description" /></th>
                            <th className={`${table.th} text-right!`}>Debit<Tip id="accounting.exports.lines.col.debit" /></th>
                            <th className={`${table.th} text-right!`}>Credit<Tip id="accounting.exports.lines.col.credit" /></th>
                            <th className={table.th}>Action<Tip id="accounting.col.viewLog" /></th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.lines.map((l, i) => (
                            <tr key={`${l.key}-${l.description}-${i}`} className={table.row}>
                              <td className={`${table.td} ${table.stickyTd}`}>
                                <div>{l.name}</div>
                                <div className={`text-lg ${l.code ? page.muted : "text-orange-700"}`}>{l.code || "no code yet"}</div>
                              </td>
                              <td className={`${table.td} whitespace-normal!`}>{l.description}</td>
                              <td className={`${table.td} text-right!`}>{l.debit ? money(l.debit) : ""}</td>
                              <td className={`${table.td} text-right!`}>{l.credit ? money(l.credit) : ""}</td>
                              <td className={table.td}><AuditLink audit={auditFor({ from: day.date })} /></td>
                            </tr>
                          ))}
                          <tr className={`${table.row} bg-(--text-color)/3`}>
                            <td className={`${table.td} ${table.stickyTd} font-bold`}>Total</td>
                            <td className={table.td} />
                            <td className={`${table.td} text-right! font-bold`}>{money(day.debit)}</td>
                            <td className={`${table.td} text-right! font-bold`}>{money(day.credit)}</td>
                            <td className={table.td} />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </section>

      {/* ---- Account codes */}
      <AccountCodes onSaved={() => setReloadTick((n) => n + 1)} />
    </section>
  );
}
