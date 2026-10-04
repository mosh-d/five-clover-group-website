"use client";

import InfoTip from "./InfoTip";
import { tipText } from "@/lib/pms/tips";

// The PMS's short "what is this" tips (owner, 2026-10-03: on every heading,
// section, field, column and button, to be cut back later). Each names an
// entry in lib/pms/tips.js; an entry that has been deleted draws nothing, so
// cutting a tip is deleting one line there.

// The (i) on its own, after a heading, a field's label or a column title.
// `light` for one on a coloured card.
export function Tip({ id, size, light }) {
  const text = tipText(id);
  if (!text) return null;
  return (
    <span className="ml-1.5 inline-flex align-middle normal-case">
      <InfoTip text={text} size={size} light={light} />
    </span>
  );
}

// Something to click - a button, a tab - with its (i) beside it. Never inside
// it: one control inside another is neither clickable nor readable to a
// screen reader.
export function WithTip({ id, children, className = "", light }) {
  const text = tipText(id);
  if (!text) return children;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {children}
      <InfoTip text={text} light={light} />
    </span>
  );
}
