"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import Modal from "@/components/pms/Modal";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import { useCollectReport } from "@/components/pms/ReportExport";
import SignedSheetView from "./SignedSheetView";
import { btn, field } from "@/components/pms/ui";
import { formatDateTime } from "@/lib/pms/format";
import { isAccountant } from "@/lib/pms/auth";
import { applyCorrections } from "@/lib/pms/signedSheet";
import {
  addReportCorrection,
  discardReportReview,
  fetchReportSignoffs,
  removeReportCorrection,
  signOffReport,
  startReportReview,
} from "@/lib/pms/api/report-signoffs-api";

// The accountant's sign-off of a report (owner, 2026-11-26; backend
// phase-104). Beside a report's own downloads, inside its <ReportScope>:
// "Review & Sign Off" takes a copy of the report as the page shows it, and
// in the review the accountant can add a note, correct a figure or a total,
// add a row or remove one - each a dialog, each marked as the accountant's.
// Signing off (two steps) sends it to Head Office's auditor. Corrections are
// on the signed copy only - folios, payments and stock are never changed.

const CORRECTION_WORDS = { note: "Note", edit: "Corrected figure", add: "Added row", delete: "Removed row" };

export default function ReportSignOff({ reportKey, from, to }) {
  const allowed = isAccountant();
  const collector = useCollectReport();
  const [status, setStatus] = useState(null);
  const [review, setReview] = useState(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!allowed || !from) return;
    try {
      setStatus(await fetchReportSignoffs(reportKey, from, to || from));
    } catch {
      setStatus(null);
    }
  }, [allowed, reportKey, from, to]);
  useEffect(() => {
    load();
  }, [load]);

  if (!allowed || !from) return null;
  const latest = status?.signed?.[0];

  const open = async () => {
    try {
      setOpening(true);
      setError(null);
      if (status?.draft) {
        setReview(status.draft);
        return;
      }
      const sheet = await collector.collect();
      if (!sheet) throw new Error(collector.failed || "The report could not be read.");
      setReview(await startReportReview({ report_key: reportKey, from, to: to || from, sheet }));
    } catch (err) {
      setError(err.message || "Could not start the review.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={open} disabled={opening} className={`${btn.secondary} inline-flex items-center gap-2 whitespace-nowrap`}>
        <IoShieldCheckmarkOutline size={20} aria-hidden="true" />
        {opening ? "Preparing..." : status?.draft ? "Continue Review" : latest ? "Review Again" : "Review & Sign Off"}
      </button>
      {latest && (
        <span className="text-base font-semibold text-green-700">
          Signed off{latest.version > 1 ? ` (version ${latest.version})` : ""} by {latest.signed_by_name || "the accountant"}, {formatDateTime(latest.signed_at)}
        </span>
      )}
      {error && <span role="alert" className="text-lg text-red-600">{error}</span>}
      {review && (
        <ReviewDialog
          review={review}
          collector={collector}
          onChange={setReview}
          onClose={() => {
            setReview(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ReviewDialog({ review, collector, onChange, onClose }) {
  const view = useMemo(() => applyCorrections(review.sheet, review.corrections), [review]);
  // One dialog at a time over the review: { kind, section, row, col, total }.
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState(null);
  const period = review.period_from === review.period_to ? review.period_from : `${review.period_from} to ${review.period_to}`;

  const correct = async (correction) => {
    onChange(await addReportCorrection(review.id, correction));
    setDialog(null);
  };
  const takeBack = async (c) => {
    try {
      setError(null);
      onChange(await removeReportCorrection(review.id, c.id));
    } catch (err) {
      setError(err.message || "That didn't go through.");
    }
  };

  const actions = {
    editCell: (section, row, col) => setDialog({ kind: "edit", section, row, col }),
    editTotal: (section, total) => setDialog({ kind: "total", section, total }),
    addRow: (section) => setDialog({ kind: "add", section }),
    removeRow: (section, row) => setDialog({ kind: "delete", section, row }),
    note: (section) => setDialog({ kind: "note", section }),
  };
  const all = review.corrections || [];

  return (
    <Modal onClose={dialog ? undefined : onClose} title={`Review: ${review.report_name}`} subtitle={`${period} - corrections are on this copy only; folios, payments and stock are not changed`} size="full">
      <div className="flex flex-col gap-8">
        {error && <p className={field.error}>{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" className={btn.secondary} onClick={() => actions.note(null)}>
            Add Note
          </button>
          <button type="button" className={btn.secondary} onClick={() => setDialog({ kind: "restart" })}>
            Start Over
          </button>
          <button type="button" className={btn.secondary} onClick={() => setDialog({ kind: "discard" })}>
            Throw Away
          </button>
          <button type="button" className={`${btn.primary} ml-auto`} onClick={() => setDialog({ kind: "sign" })}>
            Sign Off
          </button>
        </div>

        <SignedSheetView view={view} actions={actions} />

        {all.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-(--accent-2) pt-6">
            <p className="text-lg font-bold uppercase tracking-wide text-(--text-color)/68">Your corrections ({all.length})</p>
            {all.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--accent-2) px-4 py-2">
                <span className="text-lg">
                  <strong>{CORRECTION_WORDS[c.type]}</strong>
                  {c.type === "note" ? `: ${c.text}` : c.type === "edit" ? `: ${c.value}` : c.type === "add" ? `: ${(c.cells || []).filter(Boolean).join(" · ")}` : ""}
                  {c.reason ? ` - ${c.reason}` : ""}
                  <span className="text-base text-(--text-color)/60"> - {formatDateTime(c.at)}</span>
                </span>
                <button type="button" className={btn.rowSecondary} onClick={() => takeBack(c)}>
                  Take Back
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {dialog && (
        <CorrectionDialog
          dialog={dialog}
          review={review}
          view={view}
          collector={collector}
          onCorrect={correct}
          onChange={onChange}
          onClose={() => setDialog(null)}
          onDone={onClose}
        />
      )}
    </Modal>
  );
}

function CorrectionDialog({ dialog, review, view, collector, onCorrect, onChange, onClose, onDone }) {
  const section = dialog.section === null || dialog.section === undefined ? null : view.sections[dialog.section];
  const row = section && dialog.row !== undefined ? section.rows.find((r) => r.key === dialog.row) : null;
  const cell = row && dialog.col !== undefined ? row.cells[dialog.col] : null;
  const total = section && dialog.total !== undefined ? section.totals[dialog.total] : null;
  const [value, setValue] = useState(cell ? cell.text : total ? total.value : "");
  const [cells, setCells] = useState(() => (section ? section.columns.map(() => "") : []));
  const [reason, setReason] = useState("");
  const [step, setStep] = useState("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = async (fn) => {
    try {
      setBusy(true);
      setError(null);
      await fn();
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };

  const reasonField = (
    <label className="flex flex-col gap-2">
      <span className={field.label}>Why (optional)</span>
      <input type="text" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} className={field.input} placeholder="e.g. Bill 102 was rung up twice" />
    </label>
  );
  const buttons = (label, onGo, disabled = false) => (
    <div className="flex flex-wrap gap-3">
      <button type="button" className={btn.secondary} onClick={onClose} disabled={busy}>
        Back
      </button>
      <button type="button" className={btn.primary} onClick={() => run(onGo)} disabled={busy || disabled}>
        {busy ? "Saving..." : label}
      </button>
    </div>
  );

  let title;
  let body;
  if (dialog.kind === "edit" || dialog.kind === "total") {
    title = dialog.kind === "total" ? "Correct a Total" : "Correct a Figure";
    const label = dialog.kind === "total" ? total?.label : section?.columns[dialog.col]?.label;
    const was = dialog.kind === "total" ? (total && "was" in total ? total.was : total?.value) : cell && "was" in cell ? cell.was : cell?.text;
    body = (
      <div className="flex flex-col gap-4">
        <p className="text-xl">
          {section?.heading}, <strong>{label}</strong>: on the report <strong>{was || "—"}</strong>
        </p>
        <label className="flex flex-col gap-2">
          <span className={field.label}>Corrected to *</span>
          <input type="text" value={value} maxLength={300} onChange={(e) => setValue(e.target.value)} className={field.input} autoFocus />
        </label>
        {reasonField}
        <p className="text-lg text-(--text-color)/68">It shows as corrected by you, with the old figure beside it.</p>
        {error && <p className={field.error}>{error}</p>}
        {buttons(
          "Correct It",
          () =>
            onCorrect(
              dialog.kind === "total"
                ? { type: "edit", section: dialog.section, target: "total", total: dialog.total, value, reason }
                : { type: "edit", section: dialog.section, target: "cell", row: dialog.row, col: dialog.col, value, reason },
            ),
          !value.trim(),
        )}
      </div>
    );
  } else if (dialog.kind === "add") {
    title = "Add a Row";
    body = (
      <div className="flex flex-col gap-4">
        <p className="text-xl">{section?.heading}</p>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
          {section?.columns.map((c, ci) => (
            <label key={ci} className="flex flex-col gap-2">
              <span className={field.label}>{c.label || `Column ${ci + 1}`}</span>
              <input type="text" value={cells[ci]} maxLength={300} onChange={(e) => setCells((cur) => cur.map((x, i) => (i === ci ? e.target.value : x)))} className={field.input} />
            </label>
          ))}
        </div>
        {reasonField}
        {error && <p className={field.error}>{error}</p>}
        {buttons("Add It", () => onCorrect({ type: "add", section: dialog.section, cells, reason }), !cells.some((c) => c.trim()))}
      </div>
    );
  } else if (dialog.kind === "delete") {
    title = "Remove a Row";
    body = (
      <div className="flex flex-col gap-4">
        <p className="text-xl">
          {section?.heading}: <strong>{row?.cells.map((c) => c.text).filter(Boolean).join(" · ")}</strong>
        </p>
        {reasonField}
        <p className="text-lg text-(--text-color)/68">It stays on the report, struck through and marked as removed by you.</p>
        {error && <p className={field.error}>{error}</p>}
        {buttons("Remove It", () => onCorrect({ type: "delete", section: dialog.section, row: dialog.row, reason }))}
      </div>
    );
  } else if (dialog.kind === "note") {
    title = section ? `Note on ${section.heading}` : "Add a Note";
    body = (
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className={field.label}>What is wrong? *</span>
          <AutoGrowTextarea value={value} onChange={(e) => setValue(e.target.value)} className={field.textarea} maxLength={1000} />
        </label>
        {error && <p className={field.error}>{error}</p>}
        {buttons("Add Note", () => onCorrect({ type: "note", section: dialog.section, text: value }), !value.trim())}
      </div>
    );
  } else if (dialog.kind === "sign") {
    title = "Sign Off";
    body =
      step === "form" ? (
        <ConfirmPanel
          question={`Sign off the ${review.report_name} for ${review.period_from === review.period_to ? review.period_from : `${review.period_from} to ${review.period_to}`}?`}
          details={[
            `${view.count.corrections} correction(s) and ${view.count.notes} note(s), each marked as yours.`,
            "It goes to Head Office's auditor, and can't be changed after - a new review makes a new version.",
          ]}
          confirmLabel="Continue"
          busyLabel="..."
          busy={false}
          onBack={onClose}
          onConfirm={() => setStep("sure")}
        />
      ) : (
        <ConfirmPanel
          question="Are you sure? Once signed off, this version can't be edited."
          details={["Your name and the time are recorded, in the Audit Trail too."]}
          confirmLabel="Yes, sign it off"
          busyLabel="Signing..."
          busy={busy}
          error={error}
          onBack={() => setStep("form")}
          onConfirm={() => run(async () => {
            await signOffReport(review.id);
            onDone();
          })}
        />
      );
  } else if (dialog.kind === "restart") {
    title = "Start Over";
    body = (
      <ConfirmPanel
        question="Start the review again from the report as it is now?"
        details={["Your corrections and notes on this review are thrown away.", "Use this if the report itself has changed since (a late payment, the night audit)."]}
        confirmLabel="Yes, start over"
        busyLabel="Preparing..."
        busy={busy}
        error={error}
        danger
        onBack={onClose}
        onConfirm={() => run(async () => {
          const sheet = await collector.collect();
          if (!sheet) throw new Error(collector.failed || "The report could not be read.");
          onChange(await startReportReview({ report_key: review.report_key, from: review.period_from, to: review.period_to, sheet, restart: true }));
          onClose();
        })}
      />
    );
  } else if (dialog.kind === "discard") {
    title = "Throw Away";
    body = (
      <ConfirmPanel
        question="Throw this review away?"
        details={["Your corrections and notes on it are lost. Nothing has gone to the auditor."]}
        confirmLabel="Yes, throw it away"
        busyLabel="..."
        busy={busy}
        error={error}
        danger
        onBack={onClose}
        onConfirm={() => run(async () => {
          await discardReportReview(review.id);
          onDone();
        })}
      />
    );
  }

  return (
    <Modal onClose={busy ? undefined : onClose} title={title} size="md" zIndex={1100}>
      {busy && dialog.kind === "restart" ? <LoadingSpinner /> : body}
    </Modal>
  );
}
