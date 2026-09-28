"use client";

import { useState } from "react";

export const PAGE_SIZE = 10;

// Pages a list the page already holds in full, 10 rows at a time with
// <Pagination> (owner, 2026-09-28). A list that shrinks under the current
// page (a folio settled, a credit refunded) shows its last page rather than
// an empty one.
export default function usePagedRows(rows, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  return {
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    totalPages,
    setPage,
  };
}
