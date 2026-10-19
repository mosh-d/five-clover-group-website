"use client";

import { useCallback, useEffect, useState } from "react";
import { IoSparklesOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { useLiveRefresh, usePmsLive } from "@/components/pms/live/PmsLive";
import { btn, card, field, page } from "@/components/pms/ui";
import { formatDateTime, formatTime } from "@/lib/pms/format";
import { patchStoredBranch } from "@/lib/pms/session";
import {
  fetchHousekeepingBoard,
  giveRoomTo,
  markRoomForCleaning,
  putRoomBackInService,
  reviewRoom,
  setRoomOutOfOrder,
  setHousekeepingMode,
  startCleaning,
  submitForReview,
  switchHousekeeping,
} from "@/lib/pms/api/housekeeping-api";

// Housekeeping (backend docs/HOUSEKEEPING-PLAN.md) - the housekeeping
// supervisor's and housekeepers' page, and the manager's, who can do
// everything the supervisor does.
//
// Step 1: whether the branch runs housekeeping - the developer's switch
// (owner, 2026-10-16: onboarding is the developer's; a toggle, so it can be
// switched back off if anything goes wrong).
// Step 2: a room a guest leaves becomes Dirty; a housekeeper starts it and
// submits it for review; the supervisor approves it (Clean) or sends it back
// with a note. Rooms are given out the supervisor's way - Open or Assigned.
// Step 4: the supervisor sets a room out of order, saying why, and puts it
// back in service - dirty, so it is cleaned and approved first.
// Every action is asked twice (owner).

const STATES = {
  clean: { label: "Clean", className: "bg-green-100 text-green-800" },
  dirty: { label: "Dirty", className: "bg-red-100 text-red-700" },
  cleaning: { label: "Cleaning", className: "bg-sky-100 text-sky-800" },
  review: { label: "For review", className: "bg-amber-100 text-amber-800" },
};
const MANUAL = { out_of_order: "Out of order", complementary: "Complimentary", reserved: "Set aside" };

function StatePill({ state }) {
  const s = STATES[state] || STATES.clean;
  return <span className={`inline-block px-3 py-1 rounded-full text-lg font-bold whitespace-nowrap ${s.className}`}>{s.label}</span>;
}

// "14:05" today, the date and time otherwise.
const when = (d) => {
  if (!d) return "—";
  const day = (x) => new Date(x).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" });
  return day(d) === day(new Date()) ? formatTime(d) : formatDateTime(d);
};

const why = (job) =>
  job.reason === "room_move"
    ? "The guest moved to another room"
    : job.reason === "marked_dirty"
      ? `Marked for cleaning${job.reason_note ? `: ${job.reason_note}` : ""}`
      : "The guest checked out";

// Whether a housekeeper may take a job - the server's own rule
// (HousekeepingService.openTo), so the developer previewing a housekeeper
// sees what one would.
const openTo = (job, mode, me) =>
  job.status === "open" ? (job.assigned_to ? job.assigned_to.id === me : mode === "open") : job.status === "cleaning" ? job.started_by?.id === me : false;

const roomName = (room) => `Room ${room.room_number}`;

// ---------------------------------------------------------------- the actions

// Every action: what will happen, then a Yes (owner: every action asked twice).
function ActionDialog({ action, board, onClose, onDone }) {
  const { kind, room } = action;
  const job = room?.job;
  const [note, setNote] = useState("");
  const [staffId, setStaffId] = useState(job?.assigned_to?.id ? String(job.assigned_to.id) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const name = room ? roomName(room) : "";
  const cleaner = job?.submitted_by?.name || job?.started_by?.name;
  const picked = board.housekeepers.find((h) => String(h.id) === staffId);
  const holder = job?.status === "cleaning" ? job.started_by : job?.assigned_to;

  const spec = {
    switch: {
      title: board.on ? "Switch Housekeeping Off" : "Switch Housekeeping On",
      question: `Switch housekeeping ${board.on ? "off" : "on"} at ${board.branch_name}?`,
      details: board.on
        ? [
            "Rooms are ready again as soon as a guest checks out, as before.",
            "Rooms on the list keep their place for when it is switched back on.",
            "Its manager will no longer see Housekeeping.",
            "The change is recorded in the Audit Trail.",
          ]
        : [
            "Every room starts Clean.",
            "From now on a room a guest leaves becomes Dirty until a housekeeper cleans it and the supervisor approves it.",
            "Its housekeeping staff and its manager will see Housekeeping.",
            "The change is recorded in the Audit Trail.",
          ],
      confirmLabel: board.on ? "Yes, switch it off" : "Yes, switch it on",
      busyLabel: "Switching...",
      danger: board.on,
      run: async () => {
        const result = await switchHousekeeping(!board.on);
        patchStoredBranch({ housekeeping_on: result.on });
        return { message: `Housekeeping is now ${result.on ? "on" : "off"} at ${result.branch_name}.`, patch: { on: result.on }, sessionChanged: true };
      },
    },
    mode: {
      title: "How Rooms Are Given Out",
      question: action.mode === "assigned" ? "Give rooms out yourself (Assigned)?" : "Let housekeepers take rooms themselves (Open)?",
      details:
        action.mode === "assigned"
          ? [
              "Housekeepers see only the rooms given to them.",
              "Rooms waiting now that aren't given to anyone wait for you to give them out.",
              "Rooms already being cleaned stay with whoever is cleaning them.",
            ]
          : ["Every housekeeper sees every room waiting to be cleaned; the first to start one takes it.", "Rooms already given to someone stay theirs."],
      confirmLabel: action.mode === "assigned" ? "Yes, Assigned" : "Yes, Open",
      busyLabel: "Saving...",
      run: async () => {
        await setHousekeepingMode(action.mode);
        return {
          message: action.mode === "assigned" ? "Rooms are now given out by the supervisor (Assigned)." : "Housekeepers now take rooms themselves (Open).",
          patch: { mode: action.mode },
        };
      },
    },
    start: {
      title: `Start ${name}`,
      question: `Start cleaning ${name}?`,
      details: [
        ...(job?.sent_back_note ? [`Sent back: ${job.sent_back_note}`] : []),
        "Your name goes on it, so no one else takes it.",
        "Submit it for review when you finish.",
      ],
      confirmLabel: "Yes, start",
      busyLabel: "Starting...",
      run: async () => {
        await startCleaning(job.id);
        return `You started cleaning ${name}.`;
      },
    },
    submit: {
      title: `Submit ${name}`,
      noteLabel: "Note (optional)",
      noteTip: "housekeeping.submitNote",
      question: `Submit ${name} for review?`,
      details: ["The supervisor checks it, then approves it or sends it back to you."],
      confirmLabel: "Yes, submit it",
      busyLabel: "Submitting...",
      run: async () => {
        await submitForReview(job.id, note.trim());
        return `${name} is waiting for review.`;
      },
    },
    approve: {
      title: `Approve ${name}`,
      question: `Approve ${name}?`,
      details: [`It becomes Clean, ready for a guest.`, ...(cleaner ? [`Cleaned by ${cleaner}.`] : [])],
      confirmLabel: "Yes, approve it",
      busyLabel: "Approving...",
      run: async () => {
        await reviewRoom(job.id, "approve");
        return `${name} is clean.`;
      },
    },
    send_back: {
      title: `Send ${name} Back`,
      noteLabel: "What Needs Doing Again",
      noteTip: "housekeeping.sendBackNote",
      noteRequired: "Say what needs doing again - the housekeeper sees your note.",
      question: `Send ${name} back${cleaner ? ` to ${cleaner}` : ""}?`,
      details: [`It goes back${cleaner ? ` to ${cleaner}` : ""} to clean again, with your note.`, "It stays Dirty until you approve it."],
      confirmLabel: "Yes, send it back",
      busyLabel: "Sending back...",
      danger: true,
      run: async () => {
        await reviewRoom(job.id, "send_back", note.trim());
        return `${name} went back${cleaner ? ` to ${cleaner}` : ""}.`;
      },
    },
    assign: {
      title: `Give Out ${name}`,
      picker: true,
      question: picked ? `Give ${name} to ${picked.name}?` : holder ? `Take ${name} back from ${holder.name}?` : `Leave ${name} with no one?`,
      details: [
        ...(job?.status === "cleaning" && holder ? [`${holder.name} has started it; it goes back to waiting${picked ? ` for ${picked.name}` : ""}.`] : []),
        picked
          ? `Only ${picked.name} sees it.`
          : board.mode === "open"
            ? "Any housekeeper can take it."
            : "It waits until you give it to someone.",
      ],
      confirmLabel: picked ? "Yes, give it" : "Yes, take it back",
      busyLabel: "Saving...",
      run: async () => {
        const result = await giveRoomTo(job.id, picked ? picked.id : null);
        return result.to ? `${name} is now ${result.to}'s.` : `${name} is no longer given to anyone.`;
      },
    },
    ooo: {
      title: `Set ${name} Out of Order`,
      noteLabel: "Why",
      noteTip: "housekeeping.outOfOrderNote",
      noteRequired: "Say why the room is out of order - Head Office sees it.",
      question: `Set ${name} out of order?`,
      details: [
        "It can't be sold or given to a guest until it is back in service.",
        ...(room?.occupied ? ["A guest is in it now: they stay; it is flagged for when they leave."] : []),
        ...(job?.status === "open" ? ["It leaves the housekeepers' lists until it is back."] : []),
        "Head Office sees it, with your reason, on Critical and Decision Support.",
      ],
      confirmLabel: "Yes, out of order",
      busyLabel: "Saving...",
      danger: true,
      run: async () => {
        await setRoomOutOfOrder(room.room_inventory_id, note.trim());
        return `${name} is out of order.`;
      },
    },
    back: {
      title: `${name} Back in Service`,
      question: `Put ${name} back in service?`,
      details: [
        "It can be sold again.",
        job
          ? "It is still on the housekeepers' list, to be cleaned and approved."
          : "It becomes Dirty and goes on the housekeepers' list, to be cleaned and approved before a guest gets it.",
      ],
      confirmLabel: "Yes, back in service",
      busyLabel: "Saving...",
      run: async () => {
        const result = await putRoomBackInService(room.room_inventory_id);
        return result.needs_cleaning ? `${name} is back in service - it needs cleaning first.` : `${name} is back in service.`;
      },
    },
    dirty: {
      title: `Mark ${name} for Cleaning`,
      noteLabel: "Why",
      noteTip: "housekeeping.markDirtyNote",
      noteRequired: "Say why the room needs cleaning.",
      question: `Mark ${name} for cleaning?`,
      details: ["It becomes Dirty and goes on the housekeepers' list, with your reason.", "It is clean again once a housekeeper cleans it and it is approved."],
      confirmLabel: "Yes, mark it",
      busyLabel: "Saving...",
      run: async () => {
        await markRoomForCleaning(room.room_inventory_id, note.trim());
        return `${name} is on the list to clean.`;
      },
    },
  }[kind];

  const confirm = async () => {
    if (spec.noteRequired && !note.trim()) {
      setError(spec.noteRequired);
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const result = await spec.run();
      onDone(typeof result === "string" ? { message: result } : result);
    } catch (err) {
      setError(err.message || "That didn't go through. Try again.");
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onClose} title={spec.title} subtitle={room ? `${room.room_type_name}` : board.branch_name} size="md">
      <div className="flex flex-col gap-6">
        {spec.picker &&
          (board.housekeepers.length === 0 ? (
            <p className={`text-xl ${page.muted}`}>This branch has no housekeeper accounts yet - Head Office adds them on Staff Accounts.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor="hk-give-to" className={field.label}>
                Give To<Tip id="housekeeping.giveTo" />
              </label>
              <select id="hk-give-to" value={staffId} onChange={(e) => setStaffId(e.target.value)} className={`${field.select} w-full`} disabled={busy}>
                <option value="">No one</option>
                {board.housekeepers.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        {spec.noteLabel && (
          <div className="flex flex-col gap-2">
            <label htmlFor="hk-note" className={field.label}>
              {spec.noteLabel}
              <Tip id={spec.noteTip} />
            </label>
            <AutoGrowTextarea id="hk-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} maxLength={500} disabled={busy} />
          </div>
        )}
        <ConfirmPanel
          question={spec.question}
          details={spec.details}
          confirmLabel={spec.confirmLabel}
          busyLabel={spec.busyLabel}
          danger={spec.danger}
          busy={busy}
          error={error}
          onBack={onClose}
          onConfirm={confirm}
        />
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ the rooms

function RoomCard({ room, children, lines = [] }) {
  return (
    <li className={`${card.surface} p-5 flex flex-wrap items-center justify-between gap-4`}>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold text-(--black)">{roomName(room)}</span>
          <span className={`text-xl ${page.muted}`}>{room.room_type_name}</span>
          <StatePill state={room.state} />
        </div>
        {lines.filter(Boolean).map((line) => (
          <p key={line} className={`text-xl ${page.muted} break-words`}>
            {line}
          </p>
        ))}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </li>
  );
}

function Section({ id, title, tip, empty, children, count }) {
  return (
    <section aria-labelledby={id} className="w-full flex flex-col gap-4">
      <h2 id={id} className={page.sectionTitle}>
        {title}
        {count > 0 ? ` (${count})` : ""}
        <Tip id={tip} />
      </h2>
      {count > 0 ? <ul className="flex flex-col gap-3">{children}</ul> : <p className={`text-xl ${page.muted}`}>{empty}</p>}
    </section>
  );
}

// A housekeeper's page: the room they're cleaning, rooms sent back to them,
// and the rooms they may take.
function HousekeeperView({ board, me, onAction }) {
  const jobs = board.rooms.filter((r) => r.job && openTo(r.job, board.mode, me));
  const cleaning = jobs.filter((r) => r.job.status === "cleaning");
  const sentBack = jobs.filter((r) => r.job.status === "open" && r.job.sent_back_note);
  const toClean = jobs.filter((r) => r.job.status === "open" && !r.job.sent_back_note).sort((a, b) => new Date(a.job.opened_at) - new Date(b.job.opened_at));
  const busy = cleaning.length > 0;
  return (
    <>
      <Section id="hk-cleaning-now" title="Cleaning Now" tip="housekeeping.cleaningNow" count={cleaning.length} empty="You aren't cleaning a room. Start one below.">
        {cleaning.map((r) => (
          <RoomCard key={r.room_inventory_id} room={r} lines={[`Started at ${when(r.job.started_at)}`, r.job.sent_back_note && `Sent back: ${r.job.sent_back_note}`]}>
            <button type="button" onClick={() => onAction({ kind: "submit", room: r })} className={btn.rowPrimary}>
              Submit for review
            </button>
          </RoomCard>
        ))}
      </Section>
      <Section id="hk-sent-back" title="Sent Back to You" tip="housekeeping.sentBack" count={sentBack.length} empty="Nothing sent back.">
        {sentBack.map((r) => (
          <RoomCard key={r.room_inventory_id} room={r} lines={[`Sent back: ${r.job.sent_back_note}`]}>
            <button type="button" disabled={busy} onClick={() => onAction({ kind: "start", room: r })} className={btn.rowPrimary}>
              Start
            </button>
          </RoomCard>
        ))}
      </Section>
      <Section
        id="hk-to-clean"
        title="Rooms to Clean"
        tip="housekeeping.toClean"
        count={toClean.length}
        empty={board.mode === "assigned" ? "No rooms given to you right now." : "No rooms waiting to be cleaned."}
      >
        {toClean.map((r) => (
          <RoomCard key={r.room_inventory_id} room={r} lines={[`${why(r.job)}, ${when(r.job.opened_at)}`]}>
            <button type="button" disabled={busy} onClick={() => onAction({ kind: "start", room: r })} className={btn.rowPrimary}>
              Start
            </button>
          </RoomCard>
        ))}
      </Section>
      {busy && (toClean.length > 0 || sentBack.length > 0) && <p className={`text-xl ${page.muted}`}>Submit the room you're cleaning before starting another.</p>}
    </>
  );
}

// The supervisor's and the manager's page: rooms to review, rooms waiting
// and being cleaned, and every room by state.
function SupervisorView({ board, onAction }) {
  const withJob = board.rooms.filter((r) => r.job);
  const review = withJob.filter((r) => r.job.status === "review").sort((a, b) => new Date(a.job.submitted_at) - new Date(b.job.submitted_at));
  const waiting = withJob
    .filter((r) => r.job.status === "open")
    .sort((a, b) => Number(Boolean(b.job.sent_back_note)) - Number(Boolean(a.job.sent_back_note)) || new Date(a.job.opened_at) - new Date(b.job.opened_at));
  const cleaning = withJob.filter((r) => r.job.status === "cleaning");
  const outOfOrder = board.rooms.filter((r) => r.manual_status === "out_of_order");
  const counts = Object.keys(STATES).map((s) => [s, board.rooms.filter((r) => r.state === s).length]);
  const givenTo = (job) =>
    job.assigned_to ? `Given to ${job.assigned_to.name}` : board.mode === "assigned" ? "Not given to anyone yet" : "Any housekeeper can take it";
  return (
    <>
      <div className="w-full flex flex-wrap gap-3" aria-label="Rooms by state">
        {counts.map(([s, n]) => (
          <span key={s} className={`px-4 py-2 rounded-xl text-xl font-bold ${STATES[s].className}`}>
            {STATES[s].label}: {n}
          </span>
        ))}
      </div>

      <Section id="hk-review" title="For Review" tip="housekeeping.forReview" count={review.length} empty="No rooms waiting for review.">
        {review.map((r) => (
          <RoomCard
            key={r.room_inventory_id}
            room={r}
            lines={[
              `Submitted by ${r.job.submitted_by?.name || "a housekeeper"} at ${when(r.job.submitted_at)}${r.job.rounds > 1 ? ` (round ${r.job.rounds})` : ""}`,
              r.job.submitted_note && `Their note: ${r.job.submitted_note}`,
            ]}
          >
            <button type="button" onClick={() => onAction({ kind: "approve", room: r })} className={btn.rowSuccess}>
              Approve
            </button>
            <button type="button" onClick={() => onAction({ kind: "send_back", room: r })} className={btn.rowDanger}>
              Send back
            </button>
          </RoomCard>
        ))}
      </Section>

      <Section id="hk-waiting" title="Waiting to Be Cleaned" tip="housekeeping.waiting" count={waiting.length} empty="No rooms waiting to be cleaned.">
        {waiting.map((r) => (
          <RoomCard
            key={r.room_inventory_id}
            room={r}
            lines={[
              `${why(r.job)}, ${when(r.job.opened_at)}`,
              r.job.sent_back_note && `Sent back: ${r.job.sent_back_note}`,
              r.manual_status === "out_of_order" ? "Out of order - off the housekeepers' lists until it is back in service" : givenTo(r.job),
              r.occupied && "A guest is in this room",
            ]}
          >
            <button type="button" onClick={() => onAction({ kind: "assign", room: r })} className={btn.rowSecondary}>
              Give out
            </button>
          </RoomCard>
        ))}
      </Section>

      <Section id="hk-being-cleaned" title="Being Cleaned" tip="housekeeping.beingCleaned" count={cleaning.length} empty="No one is cleaning a room right now.">
        {cleaning.map((r) => (
          <RoomCard key={r.room_inventory_id} room={r} lines={[`${r.job.started_by?.name || "A housekeeper"} started at ${when(r.job.started_at)}`]}>
            <button type="button" onClick={() => onAction({ kind: "assign", room: r })} className={btn.rowSecondary}>
              Give to someone else
            </button>
          </RoomCard>
        ))}
      </Section>

      <Section id="hk-out-of-order" title="Out of Order" tip="housekeeping.outOfOrder" count={outOfOrder.length} empty="No rooms out of order.">
        {outOfOrder.map((r) => (
          <RoomCard
            key={r.room_inventory_id}
            room={r}
            lines={[
              r.out_of_order_reason ? `Why: ${r.out_of_order_reason}` : "No reason recorded",
              r.out_of_order_since && `Since ${when(r.out_of_order_since)}`,
              r.occupied && "A guest is in this room",
            ]}
          >
            <button type="button" onClick={() => onAction({ kind: "back", room: r })} className={btn.rowPrimary}>
              Back in service
            </button>
          </RoomCard>
        ))}
      </Section>

      <Section id="hk-all-rooms" title="All Rooms" tip="housekeeping.allRooms" count={board.rooms.length} empty="This branch has no numbered rooms.">
        {board.rooms.map((r) => (
          <RoomCard
            key={r.room_inventory_id}
            room={r}
            lines={[
              r.state !== "clean" || r.state_since ? `Since ${when(r.state_since)}` : null,
              MANUAL[r.manual_status],
              r.occupied && "A guest is in this room",
            ]}
          >
            {r.state === "clean" && !r.job && (
              <button type="button" onClick={() => onAction({ kind: "dirty", room: r })} className={btn.rowSecondary}>
                Mark for cleaning
              </button>
            )}
            {r.manual_status !== "out_of_order" && (
              <button type="button" onClick={() => onAction({ kind: "ooo", room: r })} className={btn.rowDanger}>
                Set out of order
              </button>
            )}
          </RoomCard>
        ))}
      </Section>
    </>
  );
}

// ------------------------------------------------------------------- the page

export default function HousekeepingPage() {
  const { role, user, branch, reloadSession } = usePmsSession();
  const { refreshHousekeepingCount } = usePmsLive();
  // The developer's own view only: viewing as a housekeeper or the
  // supervisor shows the page exactly as they see it, without the toggle
  // (owner, 2026-10-19).
  const isDeveloper = role === "developer";
  const isHousekeeper = role === "housekeeper";
  const me = Number(user?.staff_account_id) || null;
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [action, setAction] = useState(null);

  const load = useCallback(() => {
    fetchHousekeepingBoard().then(
      (d) => {
        setBoard(d);
        setError(null);
      },
      (err) => setError(err.message || "Could not load housekeeping."),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load, branch?.id]);
  // A check-out or anyone's action announces 'housekeeping'; a check-in
  // changes which rooms have a guest in them.
  useLiveRefresh(load, ["housekeeping", "reservations"]);

  // The housekeeping staff are told by notification too (PmsLive).
  useEffect(() => {
    if ((role === "housekeeper" || role === "housekeeping_supervisor") && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [role]);

  // patch: what changed, shown at once rather than after the reload.
  const done = ({ message, patch, sessionChanged }) => {
    setAction(null);
    setNotice(message);
    if (patch) setBoard((b) => (b ? { ...b, ...patch } : b));
    if (sessionChanged) reloadSession?.();
    load();
    refreshHousekeepingCount?.();
  };

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <div>
        <PageHeading icon={IoSparklesOutline} tipId="housekeeping.page">
          Housekeeping
        </PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>
          The rooms guests leave: housekeepers clean them and submit them for review, and the supervisor approves them or sends them back.
        </p>
      </div>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!board && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        board && (
          <>
            <section className={`w-full ${card.surface} p-6 md:p-8 flex flex-col gap-5`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className={page.sectionTitle}>
                  Housekeeping is {board.on ? "on" : "off"} at {board.branch_name}
                  <Tip id="housekeeping.status" />
                </h2>
                {isDeveloper && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={board.on}
                    aria-label={`Housekeeping at ${board.branch_name}`}
                    onClick={() => setAction({ kind: "switch" })}
                    className={`relative inline-flex items-center shrink-0 h-[3.2rem] w-[6rem] rounded-full cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--emphasis) ${
                      board.on ? "bg-green-600" : "bg-black/25"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-[2.6rem] w-[2.6rem] rounded-full bg-white shadow transition-transform ${board.on ? "translate-x-[3.1rem]" : "translate-x-[0.3rem]"}`}
                    />
                  </button>
                )}
              </div>
              <p className={`text-xl ${page.muted}`}>
                {!board.on
                  ? "Rooms are ready again as soon as a guest checks out, as before. The developer switches housekeeping on when the branch is ready for it."
                  : board.mode === "assigned"
                    ? "Rooms are given out by the supervisor (Assigned): each housekeeper sees the rooms given to them."
                    : "Housekeepers take rooms themselves (Open): every housekeeper sees every room waiting, and the first to start one takes it."}
              </p>
              {board.on && !isHousekeeper && (
                <div className="flex flex-col gap-2">
                  <span className={field.label}>
                    How Rooms Are Given Out
                    <Tip id="housekeeping.mode" />
                  </span>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="How rooms are given out">
                    {[
                      ["open", "Open"],
                      ["assigned", "Assigned"],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={board.mode === mode}
                        onClick={() => board.mode !== mode && setAction({ kind: "mode", mode })}
                        className={board.mode === mode ? btn.rowPrimary : btn.rowSecondary}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {board.on && (isHousekeeper ? <HousekeeperView board={board} me={me} onAction={setAction} /> : <SupervisorView board={board} onAction={setAction} />)}
          </>
        )
      )}

      {action && board && <ActionDialog action={action} board={board} onClose={() => setAction(null)} onDone={done} />}
    </div>
  );
}
