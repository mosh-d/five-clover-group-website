"use client";

import InfoTip from "./InfoTip";
import { tipText } from "@/lib/pms/tips";

// The PMS's short "what is this" tips (owner, 2026-10-03: on every heading,
// section, field and column, to be cut back later; never on a button or tab -
// owner, 2026-10-05). Each names an entry in lib/pms/tips.js; an entry that
// has been deleted draws nothing, so cutting a tip is deleting one line there.

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
