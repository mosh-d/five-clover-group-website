"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "@/lib/pms/client";
import { fetchAlerts } from "@/lib/pms/api/alerts-api";
import { fetchOtaSettlements, OTA_CHANGED_EVENT } from "@/lib/pms/api/ota-api";

// The PMS's live connection to the backend (Socket.IO) - the branch PMS's
// WebSocketContext, for whichever branch is signed in. Pages subscribe to
// what they show: 'rooms', 'reservations' (any booking changing state),
// 'new_reservation' (a booking from the guest-facing site - the front desk
// popup) and 'alerts'.
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

export function PmsLiveProvider({ branchId, canSeeAlerts, canSeeOtaPayments, children }) {
  const listenersRef = useRef({ rooms: new Set(), reservations: new Set(), new_reservation: new Set(), alerts: new Set() });
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
      value={{ isConnected, subscribe, alertCount, refreshAlertCount, syncAlertCount, otaPendingCount, refreshOtaCount, disconnectedRefreshTick }}
    >
      {children}
    </PmsLiveContext.Provider>
  );
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
