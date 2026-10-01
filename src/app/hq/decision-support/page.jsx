"use client";

import { useCallback, useEffect, useState } from "react";
import { IoBulbOutline } from "react-icons/io5";
import { fetchOutOfOrderRanking, HqApiError } from "@/lib/hq-api";
import PageHeading from "@/components/admin/PageHeading";
import useHqLive from "@/components/admin/useHqLive";
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
  cardBg,
} from "@/components/admin/adminStyles";

// Decision Support (owner, 2026-10-01): insights pulled from the branches'
// own records, each with a plain suggestion of what to do. First section:
// out-of-order rooms ranked by the bookings they may have cost - the room's
// price, how long it has been out, and the nights its room type sold every
// room it had for sale (see RoomsService.rankOutOfOrderRooms).
//
// Kept current without polling: the server announces a room going out of
// order or coming back (useHqLive), and the counts only move when a night
// ends, so the list is fetched again once at the 6am rollover.

const DAY = 24 * 60 * 60 * 1000;
const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString("en-NG")}`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const daysOut = (since, now) => Math.max(0, Math.floor((now - new Date(since).getTime()) / DAY));
const dateText = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Milliseconds until a minute past the next 6am in Lagos (UTC+1, so 05:00 UTC).
function msUntilNextNight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 5, 1));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

function suggestion(room, now) {
  const where = `Room ${room.room_number} (${room.room_type_name}) at ${room.branch_name}`;
  const out = room.since ? `out ${plural(daysOut(room.since, now), "day")}` : "out since a date that wasn't recorded";
  if (room.sold_out_nights > 0) {
    return `${where}: ${out}; every other ${room.room_type_name} room for sale was taken on ${plural(room.sold_out_nights, "night")} of ${room.nights_out}. Up to ${naira(room.lost_up_to)} in bookings may have been turned away, and each sold-out night costs about ${naira(room.price)}.`;
  }
  return `${where}: ${out}; the other ${room.room_type_name} rooms had space every night so far, but it costs ${naira(room.price)} a night whenever they fill up.`;
}

function FocusTable({ title, head, rows }) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-[22rem]">
      <h3 className="text-2xl font-semibold" style={textColorStyle}>{title}</h3>
      <div className={tableCardClass} style={tableCardStyle}>
        <div className={tableScrollClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass} style={tableHeadRowStyle}>
                {head.map((h) => <th key={h} className={tableThClass}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells) => (
                <tr key={cells[0]} className={tableRowClass} style={tableRowStyle}>
                  {cells.map((c, i) => <td key={i} className={`${tableTdClass} ${i === cells.length - 1 ? "font-semibold" : ""}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDecisionSupportPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setData(await fetchOutOfOrderRanking());
      setError(null);
    } catch (err) {
      setError(err instanceof HqApiError ? err.message : "Could not reach the server to load the analysis. Check your connection and try again.");
    } finally {
      setNow(Date.now());
    }
  }, []);

  const live = useHqLive(load);

  useEffect(() => {
    load();
    let timer;
    const atNextNight = () => {
      timer = setTimeout(() => {
        load();
        atNextNight();
      }, msUntilNextNight());
    };
    atNextNight();
    return () => clearTimeout(timer);
  }, [load]);

  const rooms = data ? data.rooms : [];
  const costly = rooms.filter((r) => r.sold_out_nights > 0);

  // Where to focus: totals by branch and by room type, dearest first.
  const sum = (list, key) => list.reduce((s, r) => s + Number(r[key] || 0), 0);
  const group = (keyOf) => {
    const map = new Map();
    for (const r of rooms) {
      const k = keyOf(r);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    return [...map.entries()].sort((a, b) => sum(b[1], "lost_up_to") - sum(a[1], "lost_up_to") || b[1].length - a[1].length);
  };
  const byBranch = group((r) => r.branch_name).map(([branch, list]) => [branch, list.length, naira(sum(list, "lost_up_to"))]);
  const byType = group((r) => `${r.room_type_name} — ${r.branch_name}`).map(([label, list]) => [
    label,
    `${list.length} of ${list[0].rooms_in_type}`,
    Math.max(...list.map((r) => r.sold_out_nights)),
    naira(sum(list, "lost_up_to")),
  ]);

  return (
    <div className="w-full flex flex-col gap-8">
      <div>
        <PageHeading icon={IoBulbOutline}>Decision Support</PageHeading>
        <p className={`${bodyText} mt-2`} style={mutedTextStyle}>
          Key insights from across the branches, with what to do about them.
        </p>
      </div>

      {error && <p className={errorBoxClass} role="alert">{error}</p>}
      {!live && (
        <p className={bodyText} style={mutedTextStyle} role="status">
          Live updates paused - reconnecting. The figures will catch up as soon as the connection is back.
        </p>
      )}

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold" style={textColorStyle}>Out of Order Rooms: What to Fix First</h2>
          <p className={bodyText} style={mutedTextStyle}>
            {data === null
              ? "Loading..."
              : rooms.length === 0
                ? "No rooms are out of order at any branch."
                : `Ranked by the bookings each room may have cost: its price, times the nights its room type sold every room it had for sale while it was out - nights a guest may have been turned away. Counted up to the night of ${dateText(data.last_night)}.`}
          </p>
        </div>

        {rooms.length > 0 && (
          <div className="rounded-xl border-2 p-6 flex flex-col gap-3" style={{ borderColor: "var(--emphasis)", backgroundColor: cardBg }}>
            <p className="text-xl font-bold uppercase tracking-wide" style={{ color: "var(--emphasis)" }}>
              {costly.length > 0 ? "Suggested: fix these first" : "Suggested"}
            </p>
            {costly.length > 0 ? (
              <ol className="flex flex-col gap-2 list-decimal pl-6">
                {costly.slice(0, 3).map((r) => (
                  <li key={r.id} className={bodyText} style={textColorStyle}>{suggestion(r, now)}</li>
                ))}
              </ol>
            ) : (
              <p className={bodyText} style={textColorStyle}>
                None of these rooms has cost a booking yet: the other rooms of each type had space every night. Start with the dearest -{" "}
                {suggestion(rooms[0], now)}
              </p>
            )}
          </div>
        )}

        {rooms.length > 0 && (
          <div className="flex flex-wrap gap-6">
            <FocusTable title="By branch" head={["Branch", "Rooms Out", "Up To Lost"]} rows={byBranch} />
            <FocusTable title="By room type" head={["Room Type", "Out", "Sold-Out Nights", "Up To Lost"]} rows={byType} />
          </div>
        )}

        {rooms.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-semibold" style={textColorStyle}>Every room out of order, ranked</h3>
            <div className={tableCardClass} style={tableCardStyle}>
              <div className={tableScrollClass}>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeadRowClass} style={tableHeadRowStyle}>
                      <th className={tableThClass}>#</th>
                      <th className={tableThClass}>Room</th>
                      <th className={tableThClass}>Branch</th>
                      <th className={tableThClass}>Room Type</th>
                      <th className={tableThClass}>Price a Night</th>
                      <th className={tableThClass}>Out For</th>
                      <th className={tableThClass}>Sold-Out Nights</th>
                      <th className={tableThClass}>Up To Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r, i) => (
                      <tr key={r.id} className={tableRowClass} style={tableRowStyle}>
                        <td className={`${tableTdClass} font-semibold`}>{i + 1}</td>
                        <td className={`${tableTdClass} font-semibold`}>{r.room_number}</td>
                        <td className={tableTdClass}>{r.branch_name}</td>
                        <td className={tableTdClass}>{r.room_type_name} <span style={mutedTextStyle}>({r.rooms_in_type} rooms)</span></td>
                        <td className={`${tableTdClass} whitespace-nowrap`}>{naira(r.price)}</td>
                        <td className={`${tableTdClass} whitespace-nowrap`}>{r.since ? plural(daysOut(r.since, now), "day") : "Not recorded"}</td>
                        <td className={`${tableTdClass} whitespace-nowrap`}>
                          {r.since ? `${r.sold_out_nights} of ${r.nights_out}` : "—"}
                        </td>
                        <td className={`${tableTdClass} whitespace-nowrap font-semibold ${r.lost_up_to > 0 ? "text-red-700" : ""}`}>{naira(r.lost_up_to)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {rooms.length > 0 && (
          <p className="text-lg" style={mutedTextStyle}>
            How this is worked out: for each night a room has been out, its room type&apos;s rooms for sale (less any out of order or set aside) are
            compared with the rooms actually occupied that night. When every room for sale was taken, the room out of order could probably have
            sold too - a sold-out night, worth the room type&apos;s standard rate. &quot;Up to&quot; because when two rooms of the same type are out
            on the same sold-out night, each counts that night, though only one guest may have been turned away. Rooms out of order or set aside
            are taken from their current status; earlier status changes aren&apos;t recorded.
          </p>
        )}
      </section>
    </div>
  );
}
