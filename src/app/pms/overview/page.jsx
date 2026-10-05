"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoGridOutline,
  IoLogInOutline,
  IoLogOutOutline,
  IoHomeOutline,
  IoBedOutline,
  IoCashOutline,
  IoWalletOutline,
  IoMoonOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoConstructOutline,
  IoGiftOutline,
  IoBriefcaseOutline,
} from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import StatusBadge from "@/components/pms/StatusBadge";
import GuestName from "@/components/pms/GuestName";
import { MotionDiv, MotionButton, staggerParent, staggerChild } from "@/components/pms/motion";
import { useLiveRefresh } from "@/components/pms/live/PmsLive";
import { btn, page, table } from "@/components/pms/ui";
import { fetchAlerts } from "@/lib/pms/api/alerts-api";
import { fetchCheckInList, fetchCheckOutList, fetchInHouse } from "@/lib/pms/api/front-office-api";
import { fetchNightAuditHistory } from "@/lib/pms/api/night-audit-api";
import { fetchReportsDashboard } from "@/lib/pms/api/reports-api";
import { fetchHouseStatus, fetchReservations, fetchRoomStatusList } from "@/lib/pms/api/reservations-pms-api";
import { fetchMaintenanceMode } from "@/lib/pms/api/room-data";
import { todayISO, yesterdayISO, monthStartISO, formatShortDate } from "@/lib/pms/dates";
import { money } from "@/lib/pms/format";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import { Tip } from "@/components/pms/Tip";

// The branch's day at a glance - the branch PMS's Overview
// (hotel-frontends admin_pages/AdminOverview.jsx), moved here.
//
// Refreshed the moment rooms, bookings or alerts change (the live socket),
// and on a slow clock besides - "Arrivals Today" rolls over at midnight with
// no change on the server to announce it.
const REFRESH_MS = 60000;

export default function PmsOverviewPage() {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [glance, setGlance] = useState({ arrivals: null, departures: null, inHouse: null });
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [lastAudit, setLastAudit] = useState(undefined); // undefined = loading, null = none yet
  const [recentBookings, setRecentBookings] = useState([]);
  const [roomFlags, setRoomFlags] = useState({ outOfOrder: [], complementary: [], reserved: [] });

  const load = useCallback(async () => {
    const today = todayISO();
    const [house, arrivals, departures, inHouse, alertList, report, audits, bookings, status, maintenance] = await Promise.allSettled([
      fetchHouseStatus(),
      fetchCheckInList(today),
      fetchCheckOutList(today),
      fetchInHouse(),
      fetchAlerts(),
      fetchReportsDashboard(monthStartISO(), today),
      fetchNightAuditHistory({ page: 1, limit: 1 }),
      fetchReservations({ page: 1, limit: 5 }),
      fetchRoomStatusList(),
      fetchMaintenanceMode(),
    ]);
    const value = (r) => (r.status === "fulfilled" ? r.value : undefined);
    const count = (r) => (Array.isArray(value(r)) ? value(r).length : null);

    if (value(house)) setRoomTypes(value(house).room_types || []);
    setIsLoading(false);
    setGlance({ arrivals: count(arrivals), departures: count(departures), inHouse: count(inHouse) });
    if (value(alertList)) setAlertsSummary(value(alertList));
    if (value(report)) setReportSummary(value(report));
    if (value(audits)) setLastAudit(value(audits).data?.[0] || null);
    if (value(bookings)) setRecentBookings(value(bookings).data || []);
    if (value(maintenance)?.maintenance_mode !== undefined) setMaintenanceMode(value(maintenance).maintenance_mode === 1);

    // Physical rooms flagged out of order, complementary or reserved - each
    // with where to find it on the Rooms page.
    if (value(status)) {
      const flags = { outOfOrder: [], complementary: [], reserved: [] };
      for (const rt of value(status).room_types || []) {
        for (const room of rt.rooms || []) {
          const entry = { roomTypeId: rt.room_type_id, roomInventoryId: room.room_inventory_id, number: room.room_number };
          if (room.display_status === "out_of_order") flags.outOfOrder.push(entry);
          else if (room.display_status === "complementary") flags.complementary.push(entry);
          else if (room.display_status === "reserved") flags.reserved.push(entry);
        }
      }
      setRoomFlags(flags);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);
  useLiveRefresh(load, ["rooms", "reservations", "alerts"]);

  // Occupied/held counts only real guests - never out-of-order or reserved
  // rooms, which are a maintenance/admin block (RoomsService.getHouseStatusSummary).
  const totalRooms = roomTypes.reduce((s, rt) => s + (rt.total_rooms || 0), 0);
  const totalOccupiedOrHeld = roomTypes.reduce((s, rt) => s + (rt.occupied || 0) + (rt.held || 0), 0);
  const totalAvailable = roomTypes.reduce((s, rt) => s + (rt.available || 0), 0);
  const occupancyPct = totalRooms > 0 ? Math.round((totalOccupiedOrHeld / totalRooms) * 100) : 0;

  const alertTotal = alertsSummary?.total || 0;
  // Every category the total counts, in the Alerts page's tab order, so the
  // parts add up to the total.
  const alertParts = alertsSummary
    ? [
        { count: alertsSummary.missed_check_ins?.length || 0, label: "missed check-in" },
        { count: alertsSummary.unconfirmed?.length || 0, label: "unconfirmed booking" },
        { count: alertsSummary.overdue_checkouts?.length || 0, label: "overdue checkout" },
        { count: alertsSummary.overdue_balances?.length || 0, label: "unpaid balance" },
        { count: alertsSummary.guest_credits?.length || 0, label: "credit to guest", plural: "credits to guests" },
      ].filter((p) => p.count > 0)
    : [];

  const reportTotals = reportSummary?.summary || {};
  // No `??` in a PMS component: this site's React Compiler and Next's
  // transform together can lower it into a temporary they never declare,
  // which crashed this page and Alerts (2026-09-28/29). A real 0 stays 0.
  const totalStays = reportTotals.total_stays == null ? "—" : reportTotals.total_stays;
  const completedStays = reportTotals.completed_stays || 0;
  const paymentsCollectedMTD = (reportSummary?.paymentMethods || []).reduce((s, m) => s + (m.total || 0), 0);
  // Current if the latest run covers yesterday's business date or later.
  const auditCurrent = lastAudit && String(lastAudit.audit_date).slice(0, 10) >= yesterdayISO();

  const go = (path) => router.push(path);
  const roomLink = (first) => (first ? `/pms/rooms?room_type_id=${first.roomTypeId}&room_id=${first.roomInventoryId}` : "/pms/rooms");
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  return (
    <>
      <div className={page.wrap}>
        <div className="w-full flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <PageHeading icon={IoGridOutline} tipId="overview.page">Overview</PageHeading>
          {lastAudit !== undefined && (
            <button
              onClick={() => go("/pms/night-audit")}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-full text-xl font-semibold cursor-pointer transition-colors ${
                auditCurrent ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
              title="Go to Night Audit"
            >
              <IoMoonOutline size={18} />
              {lastAudit === null
                ? "No night audit run yet"
                : auditCurrent
                  ? `Night audit up to date (${formatShortDate(lastAudit.audit_date)})`
                  : `Night audit overdue — last run ${formatShortDate(lastAudit.audit_date)}`}
            </button>
          )}
        </div>

        {alertsSummary &&
          (alertTotal > 0 ? (
            <button
              onClick={() => go("/pms/alerts")}
              className="w-full flex items-center justify-between gap-12 bg-orange-50 border border-orange-200 rounded-xl px-6 py-4 cursor-pointer hover:bg-orange-100 transition-colors text-left"
            >
              <span className="flex items-center gap-4 text-xl text-orange-800">
                <IoWarningOutline size={24} className="shrink-0 text-orange-600" />
                <span>
                  <strong className="font-bold">{plural(alertTotal, "alert")} need attention:</strong>{" "}
                  {alertParts.map((p, i) => (
                    <span key={p.label}>
                      {i > 0 && " · "}
                      {plural(p.count, p.label, p.plural)}
                    </span>
                  ))}
                </span>
              </span>
              <span className="text-xl font-bold text-orange-700 whitespace-nowrap">View Alerts →</span>
            </button>
          ) : (
            <div className="w-full flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-xl text-green-700">
              <IoCheckmarkCircleOutline size={24} className="shrink-0" />
              All clear — no outstanding alerts.
              <Tip id="overview.allClear" />
            </div>
          ))}

        {(roomFlags.outOfOrder.length > 0 || roomFlags.complementary.length > 0 || roomFlags.reserved.length > 0) && (
          <div className="w-full flex flex-col sm:flex-row gap-4">
            {roomFlags.outOfOrder.length > 0 && (
              <StatusBanner
                icon={IoConstructOutline}
                boldText={`${plural(roomFlags.outOfOrder.length, "room")} out of order`}
                detail="needs maintenance before it can be sold"
                color="red"
                onClick={() => go(roomLink(roomFlags.outOfOrder[0]))}
              />
            )}
            {roomFlags.complementary.length > 0 && (
              <StatusBanner
                icon={IoGiftOutline}
                boldText={`${plural(roomFlags.complementary.length, "room")} complementary`}
                detail="no room charge applied"
                color="purple"
                onClick={() => go(roomLink(roomFlags.complementary[0]))}
              />
            )}
            {roomFlags.reserved.length > 0 && (
              <StatusBanner
                icon={IoBriefcaseOutline}
                boldText={`${plural(roomFlags.reserved.length, "room")} reserved (${roomFlags.reserved.map((r) => r.number).join(", ")})`}
                detail="set aside for a branch/zonal manager"
                color="indigo"
                onClick={() => go(roomLink(roomFlags.reserved[0]))}
              />
            )}
          </div>
        )}

        <MotionDiv className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={staggerParent} initial="hidden" animate="shown">
          <GlanceCard icon={IoLogInOutline} label="Arrivals Today" value={glance.arrivals} sub="expected check-ins" onClick={() => go("/pms/check-ins")} />
          <GlanceCard icon={IoLogOutOutline} label="Departures Today" value={glance.departures} sub="expected check-outs" onClick={() => go("/pms/check-outs")} />
          <GlanceCard icon={IoHomeOutline} label="In-House Now" value={glance.inHouse} sub="guests currently staying" onClick={() => go("/pms/in-house")} />
          <GlanceCard
            icon={IoBedOutline}
            label="Available Tonight"
            value={isLoading ? null : totalAvailable}
            sub={`of ${totalRooms} rooms · ${occupancyPct}% occupied`}
            onClick={() => go("/pms/rooms")}
          />
        </MotionDiv>

        {reportSummary && (
          <MotionDiv className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={staggerParent} initial="hidden" animate="shown">
            <GlanceCard icon={IoCashOutline} label="Collected This Month" value={money(paymentsCollectedMTD)} sub="payments received MTD" onClick={() => go("/pms/reports")} accent />
            <GlanceCard
              icon={IoWalletOutline}
              label="Outstanding"
              value={money(reportTotals.total_outstanding)}
              sub="balance still owed"
              onClick={() => go("/pms/folios?tab=pending")}
              warn={Number(reportTotals.total_outstanding) > 0}
            />
            <GlanceCard
              icon={IoGridOutline}
              label="Stays This Month"
              value={totalStays}
              sub={`${completedStays} completed`}
              onClick={() => go("/pms/reports")}
            />
          </MotionDiv>
        )}

        <div className="w-full flex flex-col gap-4">
          <h2 className={page.sectionTitle}>House Status<Tip id="overview.houseStatus" /></h2>
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Room Type<Tip id="overview.house.roomType" /></th>
                    <th className={`${table.th} text-right!`}>Total Rooms<Tip id="overview.house.total" /></th>
                    <th className={`${table.th} text-right!`}>Occupied / Held<Tip id="overview.house.occupied" /></th>
                    <th className={`${table.th} text-right!`}>Available<Tip id="overview.house.available" /></th>
                    <th className={table.th}>Occupancy<Tip id="overview.house.occupancy" /></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className={table.empty}><LoadingSpinner /></td></tr>
                  ) : roomTypes.length === 0 ? (
                    <tr><td colSpan="5" className={table.empty}>No room types configured.</td></tr>
                  ) : (
                    roomTypes.map((rt) => {
                      const total = rt.total_rooms || 0;
                      const available = rt.available || 0;
                      const occupied = (rt.occupied || 0) + (rt.held || 0);
                      const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
                      return (
                        <tr key={rt.room_type_id} className={table.row}>
                          <td className={`${table.td} ${table.stickyTd} font-medium`}>{rt.room_type_name}</td>
                          <td className={`${table.td} text-right!`}>{total}</td>
                          <td className={`${table.td} text-right!`}>{occupied}</td>
                          <td className={`${table.td} text-right! font-bold ${available === 0 ? "text-red-600!" : "text-green-700!"}`}>{available}</td>
                          <td className={table.td}>
                            <div className="flex items-center gap-3">
                              <div className="w-40 max-sm:w-24 h-3 rounded-full bg-(--text-color)/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-orange-400" : "bg-green-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-lg text-(--text-color)/76 w-14">{pct}%</span>
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
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className={page.sectionTitle}>Recent Bookings<Tip id="overview.recent" /></h2>
            <button onClick={() => go("/pms/reservations")} className={btn.link}>View all →</button>
          </div>
          <div className={table.card}>
            <div className={table.scroll}>
              <table className={table.el}>
                <thead>
                  <tr className={table.headRow}>
                    <th className={`${table.th} ${table.stickyTh}`}>Guest<Tip id="overview.recent.guest" /></th>
                    <th className={`${table.th} hidden md:table-cell`}>Room Type<Tip id="overview.recent.roomType" /></th>
                    <th className={`${table.th} hidden md:table-cell`}>Check-In<Tip id="overview.recent.checkIn" /></th>
                    <th className={`${table.th} hidden md:table-cell`}>Check-Out<Tip id="overview.recent.checkOut" /></th>
                    <th className={table.th}>Status<Tip id="overview.recent.status" /></th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr><td colSpan="5" className={table.empty}>{isLoading ? <LoadingSpinner /> : "No bookings yet."}</td></tr>
                  ) : (
                    recentBookings.map((r) => (
                      <tr key={r.id} className={table.row}>
                        <td className={`${table.td} ${table.stickyTd} font-medium`}>
                          <div><GuestName name={r.guest_name} tags={r.guest_tags} /></div>
                          <div className={`text-base ${page.muted}`}>{r.booking_reference}</div>
                        </td>
                        <td className={`${table.td} hidden md:table-cell`}>{r.room_type?.name || "N/A"}</td>
                        <td className={`${table.td} hidden md:table-cell`}>{formatShortDate(r.check_in)}</td>
                        <td className={`${table.td} hidden md:table-cell`}>{formatShortDate(r.check_out)}</td>
                        <td className={table.td}><StatusBadge status={r.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {maintenanceMode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/98">
          <div className="max-w-[50rem] rounded-2xl p-16 text-center shadow-md">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-4xl font-bold mb-4">Maintenance In Progress</h2>
            <p className="text-2xl text-(--text-color)/68">Our system is currently undergoing scheduled maintenance. Please check back later.</p>
          </div>
        </div>
      )}
    </>
  );
}

function GlanceCard({ icon: Icon, label, value, sub, onClick, accent, warn }) {
  return (
    <MotionButton
      variants={staggerChild}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`text-left rounded-xl border p-6 cursor-pointer transition-[box-shadow,scale] hover:shadow-md active:scale-[0.99] ${
        accent ? "bg-(--emphasis) border-transparent text-white" : warn ? "bg-(--card) border-orange-200" : "bg-(--card) border-(--accent-2)"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`w-[3.2rem] h-[3.2rem] rounded-lg flex items-center justify-center shrink-0 ${
            accent ? "bg-white/15 text-white" : "bg-(--emphasis)/10 text-(--emphasis)"
          }`}
        >
          <Icon size={18} />
        </span>
        <p className={`text-xl font-semibold uppercase tracking-wide ${accent ? "text-white/70" : "text-(--text-color)/68"}`}>{label}</p>
      </div>
      <p className={`text-4xl font-bold ${accent ? "text-white" : warn ? "text-orange-600" : "text-(--black)"}`}>
        {value === null || value === undefined ? "…" : value}
      </p>
      {sub && <p className={`text-lg mt-1 ${accent ? "text-white/60" : "text-(--text-color)/60"}`}>{sub}</p>}
    </MotionButton>
  );
}

// Styled like the alerts strip, so manager-facing room flags read the same
// way at a glance.
const BANNER_THEMES = {
  red: { box: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100", icon: "text-red-600" },
  purple: { box: "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100", icon: "text-purple-600" },
  indigo: { box: "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100", icon: "text-indigo-600" },
};

function StatusBanner({ icon: Icon, boldText, detail, color, onClick }) {
  const theme = BANNER_THEMES[color];
  return (
    <button onClick={onClick} className={`flex-1 flex items-center gap-4 border rounded-xl px-6 py-4 text-left text-xl cursor-pointer transition-colors ${theme.box}`}>
      <Icon size={24} className={`shrink-0 ${theme.icon}`} />
      <span>
        <strong className="font-bold">{boldText}</strong>
        {detail && <> — {detail}</>}
      </span>
    </button>
  );
}
