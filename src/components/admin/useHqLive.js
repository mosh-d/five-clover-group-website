"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "@/lib/hq-api";

// One branch action can announce several changes at once; fetch once.
const REFETCH_DEBOUNCE_MS = 300;

// Head office's live connection (owner, 2026-10-01: no polling). Joins the
// server's "hq" room and calls `onChange` when a branch reports something
// that HQ pages list (critical_updated - see RoomsGateway), and once after a
// reconnect, since anything announced while the connection was down was
// missed. Returns whether the connection is up, for a "paused" note.
export default function useHqLive(onChange) {
  const [live, setLive] = useState(true);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"], reconnection: true, query: { hq: "1" } });
    let timer = null;
    let wasDisconnected = false;
    const refetch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => latest.current(), REFETCH_DEBOUNCE_MS);
    };
    socket.on("critical_updated", refetch);
    socket.on("connect", () => {
      setLive(true);
      if (wasDisconnected) refetch();
      wasDisconnected = false;
    });
    socket.on("disconnect", () => {
      wasDisconnected = true;
      setLive(false);
    });
    return () => {
      socket.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return live;
}
