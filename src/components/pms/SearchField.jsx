"use client";

import { Tip } from "@/components/pms/Tip";
import { field } from "@/components/pms/ui";

// The one search box over a list (owner, 2026-11-10: "filter items out
// instead of scrolling through 100s of items"). It narrows what is already on
// the page as you type - nothing is fetched again.
export default function SearchField({ id, value, onChange, placeholder = "Name", tip, label = "Search", className = "" }) {
  return (
    <div className={`flex flex-col gap-2 min-w-[min(100%,24rem)] ${className}`}>
      <label htmlFor={id} className={field.label}>
        {label}
        {tip && <Tip id={tip} />}
      </label>
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={field.input} autoComplete="off" />
    </div>
  );
}

// Whether any of `values` holds what was typed (any case, any order of words).
export function matchesSearch(query, ...values) {
  const words = String(query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = values.filter((v) => v !== null && v !== undefined).join(" ").toLowerCase();
  return words.every((w) => haystack.includes(w));
}
