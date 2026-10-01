"use client";

import { useCallback, useEffect, useState } from "react";
import { IoWarningOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import useHqLive from "@/components/pms/live/useHqLive";
import { page, field, table } from "@/components/pms/ui";
import { fetchOutOfOrderRooms } from "@/lib/pms/api/hq-api";
import { PmsApiError } from "@/lib/pms/client";

// Critical (Head Office): every room out of order across the group, oldest
// first. Kept current over the live socket, not by polling (owner,
// 2026-10-01): the server tells Head Office when a room goes out of order or
// comes back at any branch (critical_updated, see RoomsGateway) and only
// then is the list fetched again. "For" ticks on a local clock - no request.
const CLOCK_TICK_MS = 60 * 1000;

// When it went out of order, on the hotels' own clock.
const sinceText = (at) =>
  new Date(at).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

// How long, in the two largest units: "3 days 4 hours", "2 hours 15 minutes".
function forText(at, now) {
  const minutes = Math.max(0, Math.floor((now - new Date(at).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const part = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  if (days > 0) return hours > 0 ? `${part(days, "day")} ${part(hours, "hour")}` : part(days, "day");
  if (hours > 0) return mins > 0 ? `${part(hours, "hour")} ${part(mins, "minute")}` : part(hours, "hour");
  return part(mins, "minute");
}

export default function CriticalPage() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const data = await fetchOutOfOrderRooms();
      setRooms(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof PmsApiError ? err.message : "Could not reach the server to load out-of-order rooms. Check your connection and try again.");
    } finally {
      setNow(Date.now());
    }
  }, []);

  const live = useHqLive(load);

  useEffect(() => {
    load();
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(clock);
  }, [load]);

  const branchCount = rooms ? new Set(rooms.map((r) => r.branch_id)).size : 0;

  return (
    <div className={page.wrap}>
      <div>
        <PageHeading icon={IoWarningOutline}>Critical</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>What needs Head Office&apos;s attention across every branch.</p>
      </div>

      {error && <p className={`${field.error} w-full`} role="alert">{error}</p>}
      {!live && (
        <p className={`text-xl ${page.muted}`} role="status">
          Live updates paused - reconnecting. The list will catch up as soon as the connection is back.
        </p>
      )}

      <section className="w-full flex flex-col gap-4">
        <div>
          <h2 className={page.sectionTitle}>Out of Order Rooms</h2>
          {rooms !== null && (
            <p className={`text-xl mt-1 ${page.muted}`}>
              {rooms.length === 0
                ? "No rooms are out of order at any branch."
                : `${rooms.length} room${rooms.length === 1 ? "" : "s"} out of order across ${branchCount} branch${branchCount === 1 ? "" : "es"}, the longest first.`}
            </p>
          )}
        </div>

        {rooms === null && !error && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {rooms && rooms.length > 0 && (
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Room</th>
                    <th className={table.th}>Branch</th>
                    <th className={table.th}>Room Type</th>
                    <th className={table.th}>Out of Order Since</th>
                    <th className={table.th}>For</th>
                    <th className={table.th}>Set By</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`${table.td} ${table.stickyTd} font-semibold`}>{r.room_number}</td>
                      <td className={table.td}>{r.branch_name}</td>
                      <td className={table.td}>{r.room_type_name}</td>
                      {/* A room set out of order before the date was recorded
                          has none to show; it is listed first, as the oldest. */}
                      <td className={table.td}>{r.since ? sinceText(r.since) : "Not recorded"}</td>
                      <td className={`${table.td} font-semibold text-red-700`}>{r.since ? forText(r.since, now) : "—"}</td>
                      <td className={table.td}>{r.set_by || "Not recorded"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
