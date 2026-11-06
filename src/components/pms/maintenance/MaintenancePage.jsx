"use client";

import { useCallback, useEffect, useState } from "react";
import { IoConstructOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import PageTabs from "@/components/pms/PageTabs";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import ConfirmPanel from "@/components/pms/ConfirmPanel";
import Modal from "@/components/pms/Modal";
import Notice from "@/components/pms/Notice";
import AutoGrowTextarea from "@/components/pms/AutoGrowTextarea";
import { Tip } from "@/components/pms/Tip";
import { usePmsSession } from "@/components/pms/PmsSessionContext";
import { useLiveRefresh, usePmsLive } from "@/components/pms/live/PmsLive";
import { btn, field, page, table } from "@/components/pms/ui";
import { formatDateTime } from "@/lib/pms/format";
import { fetchMaintenance, markMaintenanceFixed } from "@/lib/pms/api/maintenance-api";

// Maintenance (backend phase-94; owner, 2026-11-06): every room set out of
// order - from Rooms or Housekeeping, always with a reason - is a job here.
// The maintenance staff (and the manager) see what needs doing, oldest
// first, and mark each fixed, which puts the room back in service. A room
// put back by someone else leaves the list on its own.

const roomName = (job) => (job.room_number ? `Room ${job.room_number}` : `A ${job.room_type_name} room`);

// "3 days", "5 hours", "20 minutes" - how long a room has been out of order.
const howLong = (since) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 60000));
  const [n, unit] = minutes >= 2880 ? [Math.floor(minutes / 1440), "day"] : minutes >= 120 ? [Math.floor(minutes / 60), "hour"] : [minutes, "minute"];
  return `${n} ${unit}${n !== 1 ? "s" : ""}`;
};

function FixedDialog({ job, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const room = roomName(job);
  const confirm = async () => {
    try {
      setBusy(true);
      setError(null);
      const r = await markMaintenanceFixed(job.id, note.trim() || undefined);
      onDone(`${room} is fixed and back in service${r?.needs_cleaning ? " - housekeeping cleans it before a guest gets it" : ""}.`);
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  };
  return (
    <Modal onClose={busy ? undefined : onClose} title={`${room} Fixed`} size="md">
      <div className="flex flex-col gap-6">
        <p className="text-xl">
          <span className="font-semibold">What was wrong: </span>
          {job.reason}
        </p>
        <div className="flex flex-col gap-2">
          <label htmlFor="maintenance-fix-note" className={field.label}>
            What Was Done (optional)<Tip id="maintenance.fixed.note" />
          </label>
          <AutoGrowTextarea id="maintenance-fix-note" value={note} onChange={(e) => setNote(e.target.value)} className={field.textarea} maxLength={500} disabled={busy} />
        </div>
        <ConfirmPanel
          question={`Mark ${room} fixed?`}
          details={[
            "It goes back in service and can be given to guests again.",
            "At a branch that runs housekeeping it is cleaned and approved first.",
            "Whoever set it out of order is told.",
          ]}
          confirmLabel="Yes, it's fixed"
          busyLabel="Saving..."
          busy={busy}
          error={error}
          onBack={onClose}
          onConfirm={confirm}
        />
      </div>
    </Modal>
  );
}

// A column `wideOnly` shows from tablet width up (Actions: on a phone the
// button sits under the room's name instead, where a thumb reaches it).
function Head({ columns }) {
  return (
    <thead>
      <tr className={table.headRow}>
        {columns.map(([label, tip, wideOnly], i) => (
          <th key={label} className={`${table.th} ${i === 0 ? table.stickyTh : ""} ${wideOnly ? "max-md:hidden" : ""}`}>
            {label}
            <Tip id={tip} />
          </th>
        ))}
      </tr>
    </thead>
  );
}

function OpenJobs({ jobs, onFixed }) {
  const columns = [
    ["Room", "maintenance.col.room"],
    ["What's Wrong", "maintenance.col.reason"],
    ["Reported By", "maintenance.col.reportedBy"],
    ["Out of Order For", "maintenance.col.since"],
    ["Actions", "maintenance.col.actions", true],
  ];
  return (
    <div className={table.card}>
      <div className={table.scroll}>
        <table className={table.el}>
          <Head columns={columns} />
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={table.empty}>
                  Nothing to fix. Every room is in service.
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className={table.row}>
                  <td className={`${table.td} ${table.stickyTd}`}>
                    <span className="font-semibold">{roomName(j)}</span>
                    {j.room_number && <span className="block text-lg text-(--text-color)/68">{j.room_type_name}</span>}
                    <button type="button" onClick={() => onFixed(j)} className={`${btn.rowPrimary} mt-3 md:hidden`}>
                      Mark Fixed
                    </button>
                  </td>
                  <td className={`${table.td} whitespace-normal! min-w-[16rem]`}>{j.reason}</td>
                  <td className={table.td}>{j.reported_by_name || "—"}</td>
                  <td className={table.td}>
                    <span className="font-semibold">{howLong(j.reported_at)}</span>
                    <span className="block text-lg text-(--text-color)/68">since {formatDateTime(j.reported_at)}</span>
                  </td>
                  <td className={`${table.td} max-md:hidden`}>
                    <div className={table.actions}>
                      <button type="button" onClick={() => onFixed(j)} className={btn.rowPrimary}>
                        Mark Fixed
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
  );
}

function DoneJobs({ jobs }) {
  const columns = [
    ["Room", "maintenance.col.room"],
    ["What Was Wrong", "maintenance.col.reason"],
    ["Reported", "maintenance.col.reported"],
    ["Back in Service", "maintenance.col.done"],
  ];
  return (
    <div className={table.card}>
      <div className={table.scroll}>
        <table className={table.el}>
          <Head columns={columns} />
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={table.empty}>
                  No rooms came back into service in the last 30 days.
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className={table.row}>
                  <td className={`${table.td} ${table.stickyTd}`}>
                    <span className="font-semibold">{roomName(j)}</span>
                    {j.room_number && <span className="block text-lg text-(--text-color)/68">{j.room_type_name}</span>}
                  </td>
                  <td className={`${table.td} whitespace-normal! min-w-[16rem]`}>{j.reason}</td>
                  <td className={table.td}>
                    {formatDateTime(j.reported_at)}
                    {j.reported_by_name && <span className="block text-lg text-(--text-color)/68">by {j.reported_by_name}</span>}
                  </td>
                  <td className={`${table.td} whitespace-normal! min-w-[16rem]`}>
                    <span className="font-semibold">{j.done_how === "fixed" ? "Fixed" : "Put back in service"}</span>
                    <span className="block text-lg text-(--text-color)/68">
                      {formatDateTime(j.done_at)}
                      {j.done_by_name ? `, by ${j.done_by_name}` : ""}
                    </span>
                    {j.fix_note && <span className="block text-lg">{j.fix_note}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const { role } = usePmsSession();
  const { refreshMaintenanceCount } = usePmsLive();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState("open");
  const [fixing, setFixing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useLiveRefresh(reload, ["maintenance"]);

  useEffect(() => {
    let cancelled = false;
    fetchMaintenance().then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      },
      (err) => !cancelled && setError(err.message || "Could not load the maintenance list."),
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Maintenance staff are told of new jobs on their phone: ask once.
  useEffect(() => {
    if (role === "maintenance" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [role]);

  const done = (message) => {
    setFixing(null);
    setNotice(message);
    reload();
    refreshMaintenanceCount();
  };
  const open = data?.open || [];

  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoConstructOutline}
        tipId="maintenance.page"
        title="Maintenance"
        description="Rooms set out of order, with what is wrong. Fix each one and mark it fixed to put the room back in service."
      >
        <PageTabs
          tabs={[
            { key: "open", label: "To Fix", badge: open.length, badgeLabel: "rooms out of order to fix" },
            { key: "done", label: "Done" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </PageHeader>

      <Notice message={notice} onDismiss={() => setNotice(null)} />
      {error && <p className={`${field.error} w-full`}>{error}</p>}

      {!data && !error ? (
        <div className="flex justify-center py-10 w-full">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        data && (
          <div className="w-full flex flex-col gap-6">
            <p className={page.sectionIntro}>
              {tab === "open"
                ? "Oldest first. A room put back in service from Rooms or Housekeeping leaves this list on its own."
                : "Rooms that came back into service in the last 30 days, newest first."}
            </p>
            {tab === "open" ? <OpenJobs jobs={open} onFixed={setFixing} /> : <DoneJobs jobs={data.done} />}
          </div>
        )
      )}
      {fixing && <FixedDialog job={fixing} onClose={() => setFixing(null)} onDone={done} />}
    </div>
  );
}
