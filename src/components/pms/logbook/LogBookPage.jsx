"use client";

import { useCallback, useEffect, useState } from "react";
import { IoBookOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import Toast from "@/components/pms/Toast";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { useLiveRefresh, usePmsLive } from "@/components/pms/live/PmsLive";
import { btn, card, field, page } from "@/components/pms/ui";
import { formatDate, formatTime } from "@/lib/pms/format";
import { getStoredStaffAccountId } from "@/lib/pms/auth";
import { fetchLogBook, markLogBookNoteRead, writeLogBookNote } from "@/lib/pms/api/log-book-api";
import { discardDraft, useDraft } from "@/lib/pms/drafts";

// The front desk's log book (owner, 2026-11-18; backend phase-99): notes a
// receptionist leaves for whoever has the next shift - a wake-up call, a
// guest's request, something to follow up. Newest first, by business day.
// A note is written once and never edited; the next shift marks it read, and
// whoever wrote it sees who read it and when. The sidebar badge counts the
// notes someone else left that no one has read.

const MAX = 2000;
const ROLE_NAMES = { receptionist: "Receptionist", manager: "Manager", developer: "Developer" };

function WriteDialog({ onClose, onDone }) {
  // Kept as a draft until it is saved (lib/pms/drafts.js, owner 2026-11-27).
  const [note, setNote] = useDraft("log-book-note", "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const text = note.trim();
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await writeLogBookNote(text);
      discardDraft("log-book-note");
      onDone("Your note is in the log book.");
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title="Write a Note" size="md">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="log-book-note" className={field.label}>
            Note for the Next Shift<Tip id="logBook.note" />
          </label>
          <AutoGrowTextarea
            id="log-book-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${field.textarea} min-h-[10rem]`}
            maxLength={MAX}
            disabled={busy}
            placeholder="e.g. Room 204's guest wants a wake-up call at 5am."
          />
          <span className={field.hint}>
            {text.length} of {MAX} characters
          </span>
        </div>
        {text ? (
          <ConfirmPanel
            question="Put this note in the log book?"
            details={["Everyone at the front desk sees it, with your name and the time.", "A note can't be changed or taken back once it is in."]}
            confirmLabel="Yes, add it"
            busyLabel="Saving..."
            busy={busy}
            error={error}
            onBack={onClose}
            onConfirm={confirm}
          />
        ) : (
          <div>
            <button type="button" onClick={onClose} className={btn.secondary}>
              Back
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Entry({ entry, me, onRead }) {
  const mine = me && Number(entry.written_by) === Number(me);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const read = async () => {
    try {
      setBusy(true);
      setError(null);
      await markLogBookNoteRead(entry.id);
      onRead();
    } catch (err) {
      setError(err.message || "That didn't go through.");
    } finally {
      setBusy(false);
    }
  };
  const unread = !entry.read_at;
  return (
    <li className={`${card.surface} p-6 flex flex-col gap-4 ${unread && !mine ? "border-l-4 border-l-(--emphasis)" : ""}`}>
      <p className="text-2xl whitespace-pre-wrap break-words text-(--black)">{entry.note}</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className={`text-lg ${page.muted}`}>
          {mine ? "You" : entry.written_by_name || "Someone"}
          {!mine && entry.written_by_role ? ` (${ROLE_NAMES[entry.written_by_role] || entry.written_by_role})` : ""}, at {formatTime(entry.created_at)}
        </p>
        {entry.read_at ? (
          <span className="text-lg font-semibold text-green-700">
            Read by {Number(entry.read_by) === Number(me) ? "you" : entry.read_by_name || "someone"} at {formatTime(entry.read_at)}
            {formatDate(entry.read_at) !== formatDate(entry.created_at) ? `, ${formatDate(entry.read_at)}` : ""}
          </span>
        ) : mine ? (
          <span className={`text-lg ${page.muted}`}>Not read yet</span>
        ) : (
          <button type="button" onClick={read} disabled={busy} className={btn.rowPrimary}>
            {busy ? "Saving..." : "Mark as Read"}
          </button>
        )}
      </div>
      {error && <p className={field.error}>{error}</p>}
    </li>
  );
}

const dayHeading = (day, today) => {
  const label = formatDate(`${day}T12:00:00Z`);
  return day === today ? `Today - ${label}` : label;
};

export default function LogBookPage() {
  const { refreshLogBookCount } = usePmsLive();
  const me = getStoredStaffAccountId();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [writing, setWriting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useLiveRefresh(reload, ["logbook"]);

  useEffect(() => {
    let cancelled = false;
    fetchLogBook().then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the log book."),
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const changed = (message) => {
    setWriting(false);
    if (message) setToast(message);
    reload();
    refreshLogBookCount();
  };

  // Grouped by the business day each note was written on, newest first.
  const days = [];
  for (const e of data?.entries || []) {
    const day = String(e.business_date).slice(0, 10);
    if (days[days.length - 1]?.day !== day) days.push({ day, entries: [] });
    days[days.length - 1].entries.push(e);
  }

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoBookOutline}
        tipId="logBook.page"
        title="Log Book"
        description="Notes for whoever has the next shift - a wake-up call, a guest's request, something to follow up. Read the ones left for you and mark them read."
        actions={
          <button type="button" onClick={() => setWriting(true)} className={btn.primary}>
            Write a Note
          </button>
        }
      />
      <Toast message={toast} onClose={() => setToast(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <div className="w-full flex flex-col gap-10">
            {days.length === 0 && <p className={`text-xl ${page.muted}`}>No notes in the last 30 days. Write the first one for the next shift.</p>}
            {days.map(({ day, entries }) => (
              <section key={day} className="w-full flex flex-col gap-4">
                <h2 className={page.sectionTitle}>
                  {dayHeading(day, data.today)}
                  <Tip id="logBook.day" />
                </h2>
                <ul className="flex flex-col gap-4">
                  {entries.map((e) => (
                    <Entry key={e.id} entry={e} me={me} onRead={() => changed("Marked as read.")} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      )}
      {writing && <WriteDialog onClose={() => setWriting(false)} onDone={changed} />}
    </div>
  );
}
