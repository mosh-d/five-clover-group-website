"use client";

import { useCallback, useEffect, useState } from "react";
import { IoBulbOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import { OooLabel } from "@/components/pms/InfoTip";
import useHqLive from "@/components/pms/live/useHqLive";
import { page, field, table, card } from "@/components/pms/ui";
import { fetchOutOfOrderRanking } from "@/lib/pms/api/hq-api";
import { PmsApiError } from "@/lib/pms/client";

// Decision Support (Head Office, owner 2026-10-01): insights pulled from the
// branches' own records, each with a plain suggestion of what to do. First
// section: out-of-order rooms ranked by the bookings they may have cost -
// the room's price, how long it has been out, and the nights its room type
// sold every room it had for sale (see RoomsService.rankOutOfOrderRooms).
//
// Kept current without polling: the server announces a room going out of
// order or coming back (useHqLive), and the counts only move when a night
// ends, so the list is fetched again once at the 6am rollover.

const DAY = 24 * 60 * 60 * 1000;
const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString("en-NG")}`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const daysOut = (since, now) => Math.max(0, Math.floor((now - new Date(since).getTime()) / DAY));
const dateText = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const byRoomNumber = (a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true });

// Milliseconds until a minute past the next 6am in Lagos (UTC+1, so 05:00 UTC).
function msUntilNextNight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 5, 1));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

// The rooms of one type at one branch together - they share their sold-out
// nights, so the suggestion names them as one category ("014, 011"; owner,
// 2026-10-01), the costliest category first.
function byCategory(rooms, now) {
  const groups = new Map();
  for (const r of rooms) {
    const key = `${r.branch_id}|${r.room_type_id}`;
    if (!groups.has(key)) groups.set(key, { key, branch_name: r.branch_name, room_type_name: r.room_type_name, price: Number(r.price) || 0, rooms: [] });
    groups.get(key).rooms.push(r);
  }
  return [...groups.values()]
    .map((g) => {
      const dated = g.rooms.filter((r) => r.since);
      return {
        ...g,
        rooms: [...g.rooms].sort(byRoomNumber),
        lost: g.rooms.reduce((s, r) => s + Number(r.lost_up_to || 0), 0),
        soldOut: Math.max(...g.rooms.map((r) => Number(r.sold_out_nights) || 0)),
        nightsOut: Math.max(0, ...g.rooms.map((r) => Number(r.nights_out) || 0)),
        longestDays: dated.length ? Math.max(...dated.map((r) => daysOut(r.since, now))) : null,
      };
    })
    .sort((a, b) => b.lost - a.lost || b.price - a.price || b.rooms.length - a.rooms.length);
}

function suggestion(group) {
  const several = group.rooms.length > 1;
  const which = `${group.room_type_name} at ${group.branch_name}, room${several ? "s" : ""} ${group.rooms.map((r) => r.room_number).join(", ")}`;
  const out = group.longestDays === null ? "out since a date that wasn't recorded" : `out ${several ? "up to " : ""}${plural(group.longestDays, "day")}`;
  if (group.lost > 0) {
    const nights = several ? `up to ${plural(group.soldOut, "night")}` : `${plural(group.soldOut, "night")} of ${group.nightsOut}`;
    return `${which}: ${out}; every other ${group.room_type_name} for sale was taken on ${nights}. Potential loss ${naira(group.lost)}, at ${naira(group.price)} a night${several ? " each" : ""}.`;
  }
  return `${which}: ${out}; the other ${group.room_type_name} rooms have had space every night so far, but ${several ? "each costs" : "it costs"} ${naira(group.price)} a night whenever they fill up.`;
}

// A small ranking table: its first column pinned, as every PMS table's is.
function FocusTable({ title, head, rows }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <h3 className="text-2xl font-semibold text-(--text-color)">{title}</h3>
      <div className={table.card}>
        <div className={table.scroll}>
          <table className={table.el}>
            <thead>
              <tr className={table.headRow}>
                {head.map((h, i) => (
                  <th key={i} className={`${table.th} ${i === 0 ? table.stickyTh : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells) => (
                <tr key={cells[0]} className={table.row}>
                  {cells.map((c, i) => (
                    <td key={i} className={`${table.td} ${i === 0 ? `${table.stickyTd} font-semibold` : ""} ${i === cells.length - 1 ? "font-semibold" : ""}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DecisionSupportPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setData(await fetchOutOfOrderRanking());
      setError(null);
    } catch (err) {
      setError(err instanceof PmsApiError ? err.message : "Could not reach the server to load the analysis. Check your connection and try again.");
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
  const categories = byCategory(rooms, now);
  const costly = categories.filter((g) => g.lost > 0);

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
    <div className={page.wrap}>
      <div>
        <PageHeading icon={IoBulbOutline}>Decision Support</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>Key insights from across the branches, with what to do about them.</p>
      </div>

      {error && <p className={`${field.error} w-full`} role="alert">{error}</p>}
      {!live && (
        <p className={`text-xl ${page.muted}`} role="status">
          Live updates paused - reconnecting. The figures will catch up as soon as the connection is back.
        </p>
      )}

      <section className="w-full flex flex-col gap-6">
        <div>
          <h2 className={page.sectionTitle}>Out of Order Rooms: What to Fix First</h2>
          {data && (
            <p className={`text-xl mt-1 ${page.muted}`}>
              {rooms.length === 0
                ? "No rooms are out of order at any branch."
                : `Ranked by the bookings each room may have cost: its price, times the nights its room type sold every room it had for sale while it was out - nights a guest may have been turned away. Counted up to the night of ${dateText(data.last_night)}.`}
            </p>
          )}
        </div>

        {data === null && !error && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {categories.length > 0 && (
          <div className={`${card.surface} border-2 border-(--emphasis) p-8 flex flex-col gap-3`}>
            <p className="text-xl font-bold uppercase tracking-wide text-(--emphasis)">{costly.length > 0 ? "Suggested: fix these first" : "Suggested"}</p>
            {costly.length > 0 ? (
              <ol className="flex flex-col gap-2 list-decimal pl-6">
                {costly.slice(0, 3).map((g) => (
                  <li key={g.key} className="text-xl text-(--text-color)">{suggestion(g)}</li>
                ))}
              </ol>
            ) : (
              <p className="text-xl text-(--text-color)">
                None of these rooms has cost a booking yet: the other rooms of each type had space every night. Start with the dearest - {suggestion(categories[0])}
              </p>
            )}
          </div>
        )}

        {rooms.length > 0 && (
          // One above the other: side by side, the room-type table ran
          // wider than its half and hid its last column.
          <div className="w-full flex flex-col gap-6">
            <FocusTable title="By branch" head={["Branch", <OooLabel key="ooo" label="Rooms OOO" />, "Potential Loss"]} rows={byBranch} />
            <FocusTable title="By room type" head={["Room Type", <OooLabel key="ooo" />, "Sold-Out Nights", "Potential Loss"]} rows={byType} />
          </div>
        )}

        {rooms.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            <h3 className="text-2xl font-semibold text-(--text-color)">Every room out of order, ranked</h3>
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} ${table.stickyTh}`}>Room</th>
                      <th className={table.th}>Branch</th>
                      <th className={table.th}>Room Type</th>
                      <th className={table.th}>Price a Night</th>
                      <th className={table.th}><OooLabel label="OOO For" /></th>
                      <th className={table.th}>Sold-Out Nights</th>
                      <th className={table.th}>Potential Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r, i) => (
                      <tr key={r.id} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd} font-semibold`}>
                          <span className="text-(--text-color)/55 font-normal">{i + 1}.</span> {r.room_number}
                        </td>
                        <td className={table.td}>{r.branch_name}</td>
                        <td className={table.td}>
                          {r.room_type_name} <span className={page.muted}>({r.rooms_in_type} rooms)</span>
                        </td>
                        <td className={table.td}>{naira(r.price)}</td>
                        <td className={table.td}>{r.since ? plural(daysOut(r.since, now), "day") : "Not recorded"}</td>
                        <td className={table.td}>{r.since ? `${r.sold_out_nights} of ${r.nights_out}` : "—"}</td>
                        <td className={`${table.td} font-semibold ${r.lost_up_to > 0 ? "text-red-700" : ""}`}>{naira(r.lost_up_to)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {rooms.length > 0 && (
          <p className={`text-lg ${page.muted}`}>
            How this is worked out: for each night a room has been out, its room type&apos;s rooms for sale (less any out of order or set aside) are
            compared with the rooms actually occupied that night. When every room for sale was taken, the room out of order could probably have
            sold too - a sold-out night, worth the room type&apos;s standard rate. Potential loss is the most it could have cost: when two rooms of
            the same type are out on the same sold-out night, each counts that night, though only one guest may have been turned away. Rooms out
            of order or set aside are taken from their current status; earlier status changes aren&apos;t recorded.
          </p>
        )}
      </section>
    </div>
  );
}
