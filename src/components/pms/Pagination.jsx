"use client";

import { btn } from "./ui";

// Previous / Page X of Y / Next under a table - the one pager every paged
// PMS list uses (the branch PMS's Pagination). Nothing when it all fits.
export default function Pagination({ page, totalPages, onPage, className = "mt-6" }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className={`flex justify-center items-center gap-4 w-full ${className}`}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={btn.rowSecondary}>
        Previous
      </button>
      <span className="text-lg font-medium">
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={btn.rowSecondary}>
        Next
      </button>
    </div>
  );
}
