"use client";

import { useCallback, useEffect, useState } from "react";
import { IoCheckboxOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import PageTabs from "@/components/pms/PageTabs";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import Toast from "@/components/pms/Toast";
import ManagerOnlyTag from "@/components/pms/ManagerOnlyTag";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDate, formatTime } from "@/lib/pms/format";
import { isManager } from "@/lib/pms/auth";
import { confirmChecklist, createChecklist, fetchChecklists, updateChecklist } from "@/lib/pms/api/daily-checklist-api";

// Daily checklists (owner, 2026-11-19; backend phase-102): the front desk's
// (GSA) and the porters'. One per person, per shift, per business day.
// Whoever is on shift fills it in - a tick and a remark per task - and can
// come back to tick more until the manager confirms it as supervisor,
// ticking the tasks they saw done. Porters fill theirs in on the front desk
// computer, in the receptionist's sign-in, for now. Every change is a dialog.

const TABS = [
  { key: "front_desk", label: "Front Desk (GSA)" },
  { key: "porter", label: "Porter" },
];
const MAX_REMARKS = 500;
const dayLabel = (day) => formatDate(`${String(day).slice(0, 10)}T12:00:00Z`);
const doneCount = (items) => (items || []).filter((i) => i.done).length;
const confirmedCount = (items) => (items || []).filter((i) => i.confirmed).length;

/**
 * One checklist in a dialog. mode: "new" (fill one in), "edit" (tick more
 * during the shift), "confirm" (the manager's supervisor ticks) or "view".
 */
function ChecklistDialog({ mode, data, checklist, onClose, onDone }) {
  const tasks = data.tasks;
  const byN = new Map((checklist?.items || []).map((i) => [Number(i.n), i]));
  const [shift, setShift] = useState(checklist?.shift || "");
  const [staffName, setStaffName] = useState(checklist?.staff_name || "");
  const [items, setItems] = useState(() =>
    Object.fromEntries(tasks.map((t) => [t.n, { done: Boolean(byN.get(t.n)?.done), remarks: byN.get(t.n)?.remarks || "" }])),
  );
  const [confirmed, setConfirmed] = useState(() => new Set(tasks.filter((t) => byN.get(t.n)?.done).map((t) => t.n)));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const filling = mode === "new" || mode === "edit";
  const supervising = mode === "confirm";
  const showSupervisor = supervising || Boolean(checklist?.confirmed_at);
  const setItem = (n, patch) => {
    setError(null);
    setItems((cur) => ({ ...cur, [n]: { ...cur[n], ...patch } }));
  };
  const toggleConfirmed = (n, on) =>
    setConfirmed((cur) => {
      const next = new Set(cur);
      if (on) next.add(n);
      else next.delete(n);
      return next;
    });
  const done = Object.values(items).filter((i) => i.done).length;
  const ticked = tasks.filter((t) => byN.get(t.n)?.done);

  const save = async () => {
    const problem =
      mode === "new" && !shift ? "Pick the shift." : mode === "new" && !staffName.trim() ? "Type the staff member's name." : null;
    if (problem) {
      setError(problem);
      return;
    }
    const payload = tasks.map((t) => ({ n: t.n, done: Boolean(items[t.n]?.done), remarks: (items[t.n]?.remarks || "").trim() }));
    try {
      setBusy(true);
      setError(null);
      if (mode === "new") {
        await createChecklist({ kind: data.kind, shift, staff_name: staffName.trim(), items: payload });
        onDone(`${staffName.trim()}'s ${shift} checklist is saved.`);
      } else if (mode === "edit") {
        await updateChecklist(checklist.id, payload);
        onDone(`${checklist.staff_name}'s checklist is updated.`);
      } else {
        await confirmChecklist(checklist.id, [...confirmed], note.trim() || undefined);
        onDone(`${checklist.staff_name}'s checklist is confirmed.`);
      }
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };

  const title =
    mode === "new" ? `New ${data.kind === "porter" ? "Porter" : "Front Desk"} Checklist` : `${checklist.staff_name} - ${checklist.shift} Shift`;
  const subtitle = mode === "new" ? dayLabel(data.today) : dayLabel(checklist.business_date);

  return (
    <Modal onClose={busy ? undefined : onClose} title={title} subtitle={subtitle} size="xl">
      <div className="flex flex-col gap-6">
        {mode === "new" && (
          <div className="grid grid-cols-[12rem_1fr] max-sm:grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="checklist-shift" className={field.label}>
                Shift<Tip id="checklist.shift" />
              </label>
              <select id="checklist-shift" value={shift} onChange={(e) => setShift(e.target.value)} className={field.select} disabled={busy}>
                <option value="">Pick one</option>
                {data.shifts.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="checklist-staff" className={field.label}>
                Staff Name<Tip id="checklist.staffName" />
              </label>
              <input
                id="checklist-staff"
                type="text"
                value={staffName}
                maxLength={100}
                onChange={(e) => setStaffName(e.target.value)}
                className={field.input}
                disabled={busy}
                placeholder={data.kind === "porter" ? "The porter's full name" : "Your full name"}
              />
            </div>
          </div>
        )}

        {/* The tasks - one row each, stacked on a phone. */}
        <ol className="flex flex-col divide-y divide-(--accent-2) border border-(--accent-2) rounded-xl">
          {tasks.map((t) => {
            const item = items[t.n];
            const saved = byN.get(t.n);
            return (
              <li key={t.n} className={`p-4 flex flex-col gap-3 ${t.notApplicable ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-4">
                  <span className="text-lg font-bold text-(--text-color)/68 w-8 shrink-0 pt-0.5">{t.n}</span>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-xl text-(--black)">{t.task}</span>
                    {t.responsible && <span className={`text-base ${page.muted}`}>{t.responsible}</span>}
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    {t.notApplicable ? (
                      <span className={`text-base ${page.muted}`}>Not yet applicable</span>
                    ) : filling ? (
                      <label className="inline-flex items-center gap-2 text-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(e) => setItem(t.n, { done: e.target.checked })}
                          disabled={busy}
                          className="w-6 h-6 cursor-pointer accent-(--emphasis)"
                          aria-label={`Task ${t.n} done`}
                        />
                        Done
                      </label>
                    ) : (
                      <span className={`text-lg font-semibold ${saved?.done ? "text-green-700" : page.muted}`}>{saved?.done ? "✓ Done" : "Not done"}</span>
                    )}
                    {showSupervisor && !t.notApplicable && (
                      supervising ? (
                        <label className={`inline-flex items-center gap-2 text-lg ${saved?.done ? "cursor-pointer" : "opacity-40"}`}>
                          <input
                            type="checkbox"
                            checked={confirmed.has(t.n)}
                            onChange={(e) => toggleConfirmed(t.n, e.target.checked)}
                            disabled={busy || !saved?.done}
                            className="w-6 h-6 cursor-pointer accent-(--emphasis)"
                            aria-label={`Confirm task ${t.n}`}
                          />
                          Confirmed
                        </label>
                      ) : (
                        <span className={`text-lg font-semibold ${saved?.confirmed ? "text-green-700" : page.muted}`}>{saved?.confirmed ? "✓ Confirmed" : "Not confirmed"}</span>
                      )
                    )}
                  </div>
                </div>
                {!t.notApplicable &&
                  (filling ? (
                    // Padded, not margined: a full-width box pushed right ran
                    // past the dialog's edge.
                    <div className="sm:pl-12 min-w-0">
                      <input
                        type="text"
                        value={item.remarks}
                        maxLength={MAX_REMARKS}
                        onChange={(e) => setItem(t.n, { remarks: e.target.value })}
                        className={`${field.input} w-full min-w-0`}
                        disabled={busy}
                        placeholder="Remarks (optional)"
                        aria-label={`Task ${t.n} remarks`}
                      />
                    </div>
                  ) : (
                    saved?.remarks && <p className={`text-lg sm:ml-12 ${page.muted}`}>Remarks: {saved.remarks}</p>
                  ))}
              </li>
            );
          })}
        </ol>

        {checklist?.confirmed_at && (
          <p className="text-lg">
            Confirmed by {checklist.confirmed_by_name || "the manager"} at {formatTime(checklist.confirmed_at)}
            {checklist.supervisor_note ? ` - "${checklist.supervisor_note}"` : ""}
          </p>
        )}

        {supervising && (
          <div className="flex flex-col gap-2">
            <label htmlFor="checklist-note" className={field.label}>
              Supervisor&apos;s Remarks (optional)<Tip id="checklist.supervisorNote" />
            </label>
            <AutoGrowTextarea id="checklist-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} maxLength={MAX_REMARKS} disabled={busy} />
          </div>
        )}

        {mode === "view" ? (
          <div>
            <button type="button" onClick={onClose} className={btn.secondary}>
              Close
            </button>
          </div>
        ) : (
          <ConfirmPanel
            question={
              mode === "new"
                ? `Save this checklist, ${done} of ${tasks.filter((t) => !t.notApplicable).length} done?`
                : mode === "edit"
                  ? `Save the changes, ${done} of ${tasks.filter((t) => !t.notApplicable).length} done?`
                  : `Confirm ${confirmed.size} of ${ticked.length} ticked tasks as supervisor?`
            }
            details={
              supervising
                ? ["Once confirmed, the checklist can't be changed.", "Your name and the time are kept, in the Audit Trail too."]
                : ["You can come back and tick more during the shift, until the manager confirms it.", "It is recorded in the Audit Trail."]
            }
            confirmLabel={supervising ? "Yes, confirm it" : "Yes, save it"}
            busyLabel="Saving..."
            busy={busy}
            error={error}
            onBack={onClose}
            onConfirm={save}
          />
        )}
      </div>
    </Modal>
  );
}

export default function DailyChecklistPage() {
  const manager = isManager();
  const [kind, setKind] = useState("front_desk");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null); // { mode, checklist }
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useLiveRefresh(reload, ["checklist"]);

  useEffect(() => {
    let cancelled = false;
    fetchChecklists(kind).then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the checklists."),
    );
    return () => {
      cancelled = true;
    };
  }, [kind, reloadKey]);

  const shown = data && data.kind === kind ? data : null;
  const applicable = shown ? shown.tasks.filter((t) => !t.notApplicable).length : 0;
  const done = (message) => {
    setDialog(null);
    setToast(message);
    reload();
  };

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoCheckboxOutline}
        tipId="checklist.page"
        title="Daily Checklist"
        description="Each person on shift fills in their checklist - tick each task as it is done, with remarks where needed. Porters fill in theirs here too. The manager confirms each one as supervisor."
        actions={
          <button type="button" onClick={() => shown && setDialog({ mode: "new" })} disabled={!shown} className={btn.primary}>
            New Checklist
          </button>
        }
      >
        <PageTabs tabs={TABS} active={kind} onChange={setKind} />
      </PageHeader>
      <Toast message={toast} onClose={() => setToast(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!shown && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        shown && (
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Staff<Tip id="checklist.col.staff" /></th>
                    <th className={table.th}>Date<Tip id="checklist.col.date" /></th>
                    <th className={table.th}>Shift<Tip id="checklist.col.shift" /></th>
                    <th className={table.th}>Done<Tip id="checklist.col.done" /></th>
                    <th className={table.th}>Supervisor<Tip id="checklist.col.supervisor" /></th>
                    <th className={table.th}>Actions<Tip id="checklist.col.actions" /></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.checklists.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={table.empty}>
                        No {kind === "porter" ? "porter" : "front desk"} checklists in the last 30 days. Fill in the first one with New Checklist.
                      </td>
                    </tr>
                  ) : (
                    shown.checklists.map((c) => {
                      const today = String(c.business_date).slice(0, 10) === shown.today;
                      return (
                        <tr key={c.id} className={table.row}>
                          <td className={`${table.td} ${table.stickyTd} font-medium`}>{c.staff_name}</td>
                          <td className={table.td}>{today ? `Today - ${dayLabel(c.business_date)}` : dayLabel(c.business_date)}</td>
                          <td className={table.td}>{c.shift}</td>
                          <td className={table.td}>
                            {doneCount(c.items)} of {applicable}
                          </td>
                          <td className={table.td}>
                            {c.confirmed_at ? (
                              <span className="text-green-700 font-semibold">
                                ✓ {c.confirmed_by_name || "Confirmed"} ({confirmedCount(c.items)} of {doneCount(c.items)})
                              </span>
                            ) : (
                              <span className={page.muted}>Not yet</span>
                            )}
                          </td>
                          <td className={table.td}>
                            <div className={table.actions}>
                              <button type="button" onClick={() => setDialog({ mode: "view", checklist: c })} className={btn.rowSecondary}>
                                View
                              </button>
                              {today && !c.confirmed_at && (
                                <button type="button" onClick={() => setDialog({ mode: "edit", checklist: c })} className={btn.rowSecondary}>
                                  Update
                                </button>
                              )}
                              {manager && !c.confirmed_at && (
                                <span className="inline-flex items-center gap-2">
                                  <button type="button" onClick={() => setDialog({ mode: "confirm", checklist: c })} className={btn.rowPrimary}>
                                    Confirm
                                  </button>
                                  <ManagerOnlyTag />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
      {dialog && shown && <ChecklistDialog mode={dialog.mode} data={shown} checklist={dialog.checklist} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  );
}
