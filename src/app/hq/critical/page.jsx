"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { IoWarningOutline } from "react-icons/io5";
import { fetchOutOfOrderRooms, HqApiError, API_BASE_URL } from "@/lib/hq-api";
import PageHeading from "@/components/admin/PageHeading";
import {
  textColorStyle,
  mutedTextStyle,
  bodyText,
  errorBoxClass,
  tableCardClass,
  tableCardStyle,
  tableScrollClass,
  tableClass,
  tableHeadRowClass,
  tableHeadRowStyle,
  tableThClass,
  tableRowClass,
  tableRowStyle,
  tableTdClass,
} from "@/components/admin/adminStyles";

// Every room out of order across the group, oldest first. Kept current over
// the live socket, not by polling (owner, 2026-10-01): the server tells head
// office when a room goes out of order or comes back at any branch
// (critical_updated, see RoomsGateway) and only then is the list fetched
// again. "For" ticks on a local clock - no request involved.
const CLOCK_TICK_MS = 60 * 1000;
// One branch action can announce several changes at once; fetch once.
const REFETCH_DEBOUNCE_MS = 300;

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

export default function AdminCriticalPage() {
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState(true);
  const refetchTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchOutOfOrderRooms();
      setRooms(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof HqApiError ? err.message : "Could not reach the server to load out-of-order rooms. Check your connection and try again.");
    } finally {
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    load();
    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"], reconnection: true, query: { hq: "1" } });
    let wasDisconnected = false;
    const refetch = () => {
      clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(load, REFETCH_DEBOUNCE_MS);
    };
    socket.on("critical_updated", refetch);
    socket.on("connect", () => {
      setLive(true);
      // Anything announced while the connection was down was missed.
      if (wasDisconnected) refetch();
      wasDisconnected = false;
    });
    socket.on("disconnect", () => {
      wasDisconnected = true;
      setLive(false);
    });
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => {
      socket.disconnect();
      clearInterval(clock);
      clearTimeout(refetchTimer.current);
    };
  }, [load]);

  const branchCount = rooms ? new Set(rooms.map((r) => r.branch_id)).size : 0;

  return (
    <div className="w-full flex flex-col gap-8">
      <div>
        <PageHeading icon={IoWarningOutline}>Critical</PageHeading>
        <p className={`${bodyText} mt-2`} style={mutedTextStyle}>
          What needs head office&apos;s attention across every branch.
        </p>
      </div>

      {error && <p className={errorBoxClass} role="alert">{error}</p>}
      {!live && (
        <p className={bodyText} style={mutedTextStyle} role="status">
          Live updates paused - reconnecting. The list will catch up as soon as the connection is back.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold" style={textColorStyle}>Out of Order Rooms</h2>
          <p className={bodyText} style={mutedTextStyle}>
            {rooms === null
              ? "Loading..."
              : rooms.length === 0
                ? "No rooms are out of order at any branch."
                : `${rooms.length} room${rooms.length === 1 ? "" : "s"} out of order across ${branchCount} branch${branchCount === 1 ? "" : "es"}, the longest first.`}
          </p>
        </div>

        {rooms && rooms.length > 0 && (
          <div className={tableCardClass} style={tableCardStyle}>
            <div className={tableScrollClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass} style={tableHeadRowStyle}>
                    <th className={tableThClass}>Branch</th>
                    <th className={tableThClass}>Room</th>
                    <th className={tableThClass}>Room Type</th>
                    <th className={tableThClass}>Out of Order Since</th>
                    <th className={tableThClass}>For</th>
                    <th className={tableThClass}>Set By</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id} className={tableRowClass} style={tableRowStyle}>
                      <td className={tableTdClass}>{r.branch_name}</td>
                      <td className={`${tableTdClass} font-semibold`}>{r.room_number}</td>
                      <td className={tableTdClass}>{r.room_type_name}</td>
                      {/* A room set out of order before the date was recorded
                          has none to show; it is listed first, as the oldest. */}
                      <td className={`${tableTdClass} whitespace-nowrap`}>{r.since ? sinceText(r.since) : "Not recorded"}</td>
                      <td className={`${tableTdClass} whitespace-nowrap font-semibold text-red-700`}>{r.since ? forText(r.since, now) : "—"}</td>
                      <td className={tableTdClass}>{r.set_by || "Not recorded"}</td>
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
