"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "@/lib/pms/client";
import { fetchAlerts } from "@/lib/pms/api/alerts-api";
import { fetchOtaSettlements, OTA_CHANGED_EVENT } from "@/lib/pms/api/ota-api";
import { fetchMyCashUpDue, CASH_UP_CHANGED_EVENT } from "@/lib/pms/api/cash-up-api";
import { fetchHousekeepingCounts } from "@/lib/pms/api/housekeeping-api";
import { fetchInventoryCounts } from "@/lib/pms/api/inventory-api";
import { playSound } from "@/lib/pms/sounds";

// The PMS's live connection to the backend (Socket.IO) - the branch PMS's
// WebSocketContext, for whichever branch is signed in. Pages subscribe to
// what they show: 'rooms', 'reservations' (any booking changing state),
// 'new_reservation' (a booking from the guest-facing site - the front desk
// popup), 'alerts', 'housekeeping' (a room's cleaning changed) and
// 'inventory' (the store's stock or its requests changed).
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

// Something arriving that needs this person - a room to clean or review, a
// store request, a new alert - plays the alert sound (lib/pms/sounds.js) as
// well as notifying. A browser may refuse sound until the page has been
// touched; then it stays silent and the badge and notification still show.
const chime = () => playSound("alert");

// canHousekeep: a role with the Housekeeping page at a branch that runs it.
// chimeOnHousekeeping: the housekeeping supervisor and housekeepers, who are
// told by sound and notification; the manager has the badge.
// canSeeInventory: a role with the Inventory page. storeKeeper: the one who
// answers requests - their badge counts the requests waiting too, and a new
// one sounds and notifies.
export function PmsLiveProvider({ branchId, canSeeAlerts, canSeeOtaPayments, canCashUp, canHousekeep, chimeOnHousekeeping, canSeeInventory, storeKeeper, children }) {
  const listenersRef = useRef({ rooms: new Set(), reservations: new Set(), new_reservation: new Set(), alerts: new Set(), housekeeping: new Set(), inventory: new Set() });
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

  // The Inventory badge (Inventory, Step 3): items low on stock, and for the
  // store keeper the requests waiting as well (Step 4). Refetched whenever the
  // store changes.
  const [inventoryCount, setInventoryCount] = useState(0);
  const [inventoryPending, setInventoryPending] = useState(0);
  const [inventoryLow, setInventoryLow] = useState(0);
  const prevPendingRef = useRef(null);
  const refreshInventoryCount = useCallback(() => {
    if (!canSeeInventory) {
      prevPendingRef.current = null;
      return;
    }
    fetchInventoryCounts()
      .then((c) => {
        const pending = Number(c?.pending) || 0;
        const low = Number(c?.low) || 0;
        setInventoryCount(storeKeeper ? low + pending : low);
        setInventoryPending(pending);
        setInventoryLow(low);
        const previous = prevPendingRef.current;
        prevPendingRef.current = pending;
        if (!storeKeeper || previous === null || pending <= previous) return;
        chime();
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Store Requests", { body: `${pending} request${pending !== 1 ? "s" : ""} waiting for the store.`, tag: "store-requests" });
        }
      })
      .catch(() => {});
  }, [canSeeInventory, storeKeeper]);

  useEffect(() => {
    refreshInventoryCount();
    if (!canSeeInventory) return undefined;
    return subscribe(refreshInventoryCount, "inventory");
  }, [canSeeInventory, refreshInventoryCount, subscribe]);

  // Anything announced while the socket was down is lost: recount on
  // reconnecting, and every 30s while it stays down.
  useEffect(() => {
    if (isConnected || disconnectedRefreshTick > 0) {
      refreshHousekeepingCount();
      refreshInventoryCount();
    }
  }, [isConnected, disconnectedRefreshTick, refreshHousekeepingCount, refreshInventoryCount]);

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
    socket.on("inventory_updated", (data) => forThisBranch(data) && notify("inventory", data));

    socket.on("alerts_updated", (data) => {
      if (!forThisBranch(data)) return;
      const count = data.alert_count || 0;
      const previous = prevAlertCountRef.current;
      syncAlertCount(count);
      // A browser notification only when the count rises, and only for
      // someone who can open Alerts - it exists to send them there.
      if (canSeeAlerts && previous !== null && count > previous) chime();
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
        inventoryCount: canSeeInventory ? inventoryCount : 0,
        // The sidebar's Inventory badge is the sum of these two, as its tabs
        // show them: Stock carries the low items, Requests the waiting ones
        // (for whoever the requests count for - storeKeeper).
        inventoryPending: canSeeInventory && storeKeeper ? inventoryPending : 0,
        inventoryLow: canSeeInventory ? inventoryLow : 0,
        refreshInventoryCount,
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
  inventoryCount: 0,
  inventoryPending: 0,
  inventoryLow: 0,
  refreshInventoryCount: () => {},
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
