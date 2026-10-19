"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "@/lib/pms/client";
import { fetchAlerts } from "@/lib/pms/api/alerts-api";
import { fetchOtaSettlements, OTA_CHANGED_EVENT } from "@/lib/pms/api/ota-api";
import { fetchMyCashUpDue, CASH_UP_CHANGED_EVENT } from "@/lib/pms/api/cash-up-api";
import { fetchHousekeepingCounts } from "@/lib/pms/api/housekeeping-api";

// The PMS's live connection to the backend (Socket.IO) - the branch PMS's
// WebSocketContext, for whichever branch is signed in. Pages subscribe to
// what they show: 'rooms', 'reservations' (any booking changing state),
// 'new_reservation' (a booking from the guest-facing site - the front desk
// popup), 'alerts' and 'housekeeping' (a room's cleaning changed).
//
// The branch id only picks which room of broadcasts to join (see the
// backend's RoomsGateway) - it is not an auth boundary; nothing sent over
// the socket is more than an id and a count.
const PmsLiveContext = createContext(null);

// How long the socket may stay down before pages fall back to refetching
// over plain HTTP - a proxy that kills an idle websocket may still let HTTP
// through. Repeats for as long as the outage lasts.
const DISCONNECTED_FALLBACK_MS = 30000;

// One walk-in changes a reservation four times within seconds (created,
// room assigned, confirmed, checked in); pages refetch once, not four times.
const RESERVATION_REFRESH_DEBOUNCE_MS = 250;

// OTA payments still to arrive - the OTA Payments badge. The server sends no
// event for them, so the count is refetched when bookings or rooms change (a
// check-in may add one), when this PC changes one (OTA_CHANGED_EVENT), and
// once a minute for changes made on another PC.
const OTA_COUNT_REFRESH_MS = 60000;

// A short two-note chime for a room to clean or to review - a phone with the
// PMS open sounds as well as notifying (docs/HOUSEKEEPING-PLAN.md, §4). A
// browser may refuse sound until the page has been touched; then it stays
// silent and the badge and notification still show.
let chimeContext = null;
function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    chimeContext = chimeContext || new Ctx();
    const now = chimeContext.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = chimeContext.createOscillator();
      const gain = chimeContext.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.3);
      osc.connect(gain).connect(chimeContext.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.32);
    });
  } catch {
    // No sound is fine - the badge still shows.
  }
}

// canHousekeep: a role with the Housekeeping page at a branch that runs it.
// chimeOnHousekeeping: the housekeeping supervisor and housekeepers, who are
// told by sound and notification; the manager has the badge.
export function PmsLiveProvider({ branchId, canSeeAlerts, canSeeOtaPayments, canCashUp, canHousekeep, chimeOnHousekeeping, children }) {
  const listenersRef = useRef({ rooms: new Set(), reservations: new Set(), new_reservation: new Set(), alerts: new Set(), housekeeping: new Set() });
  const reservationTimerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  // Ticks every DISCONNECTED_FALLBACK_MS only while disconnected - pages
  // depend on it to refetch during an outage.
  const [disconnectedRefreshTick, setDisconnectedRefreshTick] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const prevAlertCountRef = useRef(null);

  // The one place alertCount is written, whatever triggered it, so the
  // increase-only browser notification never compares against a stale count.
  const syncAlertCount = useCallback((total) => {
    setAlertCount(total);
    prevAlertCountRef.current = total;
  }, []);

  // Only for a role with an Alerts page - the server refuses the rest.
  const refreshAlertCount = useCallback(() => {
    if (!canSeeAlerts) return;
    fetchAlerts()
      .then((data) => syncAlertCount(data?.total || 0))
      .catch(() => {});
  }, [canSeeAlerts, syncAlertCount]);

  useEffect(() => {
    refreshAlertCount();
  }, [refreshAlertCount]);

  const subscribe = useCallback((callback, type = "rooms") => {
    const set = listenersRef.current[type] || listenersRef.current.rooms;
    set.add(callback);
    return () => set.delete(callback);
  }, []);

  const [otaPendingCount, setOtaPendingCount] = useState(0);
  // Only for a role with an OTA Payments page - the server refuses the rest.
  const refreshOtaCount = useCallback(() => {
    if (!canSeeOtaPayments) return;
    fetchOtaSettlements("pending")
      .then((list) => setOtaPendingCount(Array.isArray(list) ? list.length : 0))
      .catch(() => {});
  }, [canSeeOtaPayments]);

  useEffect(() => {
    if (!canSeeOtaPayments) return undefined;
    refreshOtaCount();
    const timer = setInterval(refreshOtaCount, OTA_COUNT_REFRESH_MS);
    window.addEventListener(OTA_CHANGED_EVENT, refreshOtaCount);
    const offReservations = subscribe(refreshOtaCount, "reservations");
    const offRooms = subscribe(refreshOtaCount, "rooms");
    return () => {
      clearInterval(timer);
      window.removeEventListener(OTA_CHANGED_EVENT, refreshOtaCount);
      offReservations();
      offRooms();
    };
  }, [canSeeOtaPayments, refreshOtaCount, subscribe]);

  // Cash counts this person still owes - the Cash-Up badge (owner,
  // 2026-10-12: a count is expected of anyone who took cash). Refetched when
  // money may have moved (bookings change), when they submit one, and once a
  // minute.
  const [cashUpDueCount, setCashUpDueCount] = useState(0);
  const refreshCashUpDue = useCallback(() => {
    if (!canCashUp) return;
    fetchMyCashUpDue()
      .then((due) => setCashUpDueCount(due.length))
      .catch(() => {});
  }, [canCashUp]);

  useEffect(() => {
    if (!canCashUp) return undefined;
    refreshCashUpDue();
    const timer = setInterval(refreshCashUpDue, OTA_COUNT_REFRESH_MS);
    window.addEventListener(CASH_UP_CHANGED_EVENT, refreshCashUpDue);
    const offReservations = subscribe(refreshCashUpDue, "reservations");
    return () => {
      clearInterval(timer);
      window.removeEventListener(CASH_UP_CHANGED_EVENT, refreshCashUpDue);
      offReservations();
    };
  }, [canCashUp, refreshCashUpDue, subscribe]);

  // Rooms waiting on this person - the Housekeeping badge: a housekeeper's
  // rooms to clean; the supervisor's and manager's rooms to review (and, in
  // Assigned mode, to give out). Refetched whenever a room's cleaning changes
  // (a check-out included - the server announces it). A rise sounds and
  // notifies the housekeeping staff.
  const [housekeepingCount, setHousekeepingCount] = useState(0);
  const prevHousekeepingRef = useRef(null);
  const refreshHousekeepingCount = useCallback(() => {
    if (!canHousekeep) {
      prevHousekeepingRef.current = null;
      return;
    }
    fetchHousekeepingCounts()
      .then((c) => {
        const count = Number(c?.badge) || 0;
        const previous = prevHousekeepingRef.current;
        prevHousekeepingRef.current = count;
        setHousekeepingCount(count);
        if (!chimeOnHousekeeping || previous === null || count <= previous) return;
        chime();
        if ("Notification" in window && Notification.permission === "granted") {
          const waiting = c.for_review || c.to_assign ? `${count} room${count !== 1 ? "s" : ""} waiting for you` : `${count} room${count !== 1 ? "s" : ""} to clean`;
          new Notification("Housekeeping", { body: `${waiting}.`, tag: "housekeeping" });
        }
      })
      .catch(() => {});
  }, [canHousekeep, chimeOnHousekeeping]);

  useEffect(() => {
    refreshHousekeepingCount();
    if (!canHousekeep) return undefined;
    return subscribe(refreshHousekeepingCount, "housekeeping");
  }, [canHousekeep, refreshHousekeepingCount, subscribe]);

  // Anything announced while the socket was down is lost: recount on
  // reconnecting, and every 30s while it stays down.
  useEffect(() => {
    if (isConnected || disconnectedRefreshTick > 0) refreshHousekeepingCount();
  }, [isConnected, disconnectedRefreshTick, refreshHousekeepingCount]);

  useEffect(() => {
    if (!branchId) return undefined;
    const listeners = listenersRef.current;
    const notify = (type, data) =>
      listeners[type].forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error(e);
        }
      });
    const forThisBranch = (data) => Number(data?.branch_id) === Number(branchId);

    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"], reconnection: true, query: { branchId } });
    let outageTimer = null;

    socket.on("connect", () => {
      setIsConnected(true);
      clearInterval(outageTimer);
      outageTimer = null;
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
      if (!outageTimer) outageTimer = setInterval(() => setDisconnectedRefreshTick((t) => t + 1), DISCONNECTED_FALLBACK_MS);
    });

    socket.on("rooms_updated", (data) => forThisBranch(data) && notify("rooms", data));

    const reservationsChanged = (data) => {
      clearTimeout(reservationTimerRef.current);
      reservationTimerRef.current = setTimeout(() => notify("reservations", data), RESERVATION_REFRESH_DEBOUNCE_MS);
    };
    socket.on("reservations_updated", (data) => forThisBranch(data) && reservationsChanged(data));
    // A booking from the guest-facing site refreshes the lists like any other
    // change, and separately raises the front desk popup.
    socket.on("new_reservation", (data) => {
      if (!forThisBranch(data)) return;
      reservationsChanged(data);
      notify("new_reservation", data);
    });

    socket.on("housekeeping_updated", (data) => forThisBranch(data) && notify("housekeeping", data));

    socket.on("alerts_updated", (data) => {
      if (!forThisBranch(data)) return;
      const count = data.alert_count || 0;
      const previous = prevAlertCountRef.current;
      syncAlertCount(count);
      // A browser notification only when the count rises, and only for
      // someone who can open Alerts - it exists to send them there.
      if (canSeeAlerts && previous !== null && count > previous && "Notification" in window && Notification.permission === "granted") {
        new Notification("Hotel PMS — New Alert", {
          body: `${count} unresolved alert${count !== 1 ? "s" : ""} require${count === 1 ? "s" : ""} attention.`,
        });
      }
      notify("alerts", data);
    });

    return () => {
      socket.disconnect();
      clearInterval(outageTimer);
      clearTimeout(reservationTimerRef.current);
    };
  }, [branchId, canSeeAlerts, syncAlertCount]);

  return (
    <PmsLiveContext.Provider
      value={{
        isConnected,
        subscribe,
        alertCount,
        refreshAlertCount,
        syncAlertCount,
        otaPendingCount,
        refreshOtaCount,
        cashUpDueCount,
        refreshCashUpDue,
        // A count from before housekeeping was switched off isn't shown.
        housekeepingCount: canHousekeep ? housekeepingCount : 0,
        refreshHousekeepingCount,
        disconnectedRefreshTick,
      }}
    >
      {children}
    </PmsLiveContext.Provider>
  );
}

// Head Office has no branch to listen to: its pages keep themselves current
// over the socket's "hq" room instead (useHqLive). This is the same shape,
// standing still, for the pieces Head Office shares with a branch - the
// sidebar's badges and the Audit Trail's reconnect.
const HEAD_OFFICE_LIVE = {
  isConnected: true,
  subscribe: () => () => {},
  alertCount: 0,
  refreshAlertCount: () => {},
  syncAlertCount: () => {},
  otaPendingCount: 0,
  refreshOtaCount: () => {},
  cashUpDueCount: 0,
  refreshCashUpDue: () => {},
  housekeepingCount: 0,
  refreshHousekeepingCount: () => {},
  disconnectedRefreshTick: 0,
};

export function HeadOfficeLiveProvider({ children }) {
  return <PmsLiveContext.Provider value={HEAD_OFFICE_LIVE}>{children}</PmsLiveContext.Provider>;
}

export const usePmsLive = () => useContext(PmsLiveContext);
// The branch PMS's name for the same thing, used by pages moved over from it.
export const useWebSocketContext = usePmsLive;

// A page's data kept current: `load` runs whenever one of `types` changes
// on the server, after the socket reconnects (anything broadcast while it
// was down is lost), and every 30s while it stays down.
export function useLiveRefresh(load, types) {
  const { subscribe, isConnected, disconnectedRefreshTick } = usePmsLive();
  const typesKey = types.join(",");
  useEffect(() => {
    // No types: only the reconnect and outage refreshes below.
    const unsubscribers = (typesKey ? typesKey.split(",") : []).map((type) => subscribe(load, type));
    return () => unsubscribers.forEach((off) => off());
  }, [load, typesKey, subscribe]);
  const wasConnected = useRef(isConnected);
  useEffect(() => {
    if (isConnected && !wasConnected.current) load();
    wasConnected.current = isConnected;
  }, [isConnected, load]);
  useEffect(() => {
    if (disconnectedRefreshTick > 0) load();
  }, [disconnectedRefreshTick, load]);
}
