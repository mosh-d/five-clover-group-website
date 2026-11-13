"use client";

import { useState, useSyncExternalStore } from "react";

export const PAGE_SIZE = 10;

// While a report sheet is being made (ReportExport.jsx), every paged list
// shows all its rows for that one render, so the sheet has the whole list
// and not just the page on the screen. Set and cleared within one flushSync,
// so the screen never shows it.
let showingAll = false;
const listeners = new Set();
export function setShowAllRows(on) {
  showingAll = on;
  listeners.forEach((l) => l());
}
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// Pages a list the page already holds in full, 10 rows at a time with
// <Pagination> (owner, 2026-09-28). A list that shrinks under the current
// page (a folio settled, a credit refunded) shows its last page rather than
// an empty one.
export default function usePagedRows(rows, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const all = useSyncExternalStore(subscribe, () => showingAll, () => false);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  return {
    rows: all ? rows : rows.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    totalPages,
    setPage,
  };
}
