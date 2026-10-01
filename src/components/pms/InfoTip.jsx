"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { IoInformationCircleOutline } from "react-icons/io5";

// Where a tip goes for an element: above it, opening inwards near either
// edge of the screen so it is never squeezed against one. Drawn into the
// page's own root, which carries the brand's colours (a tip in <body> would
// have none), over everything, so a table's scrolling card can't clip it.
export function tipFor(el, text) {
  const r = el.getBoundingClientRect();
  const w = window.innerWidth;
  const centre = r.left + r.width / 2;
  const place = centre > (w * 2) / 3 ? { right: w - r.right } : centre < w / 3 ? { left: r.left } : { left: centre, shift: "-50%" };
  return { text, top: r.top, root: el.closest(".admin-root") || document.body, ...place };
}

// A small dark label floating above whatever it describes (see tipFor).
export function FloatingTip({ tip }) {
  if (!tip?.text) return null;
  return createPortal(
    <div
      role="tooltip"
      className="fixed z-[2000] pointer-events-none rounded-lg px-3 py-2 text-lg font-normal normal-case tracking-normal shadow-lg bg-(--text-color) text-white"
      style={{
        left: tip.left,
        right: tip.right,
        top: tip.top - 8,
        transform: `translate(${tip.shift || "0"}, -100%)`,
        width: "max-content",
        maxWidth: "min(44rem, calc(100vw - 1.6rem))",
      }}
    >
      {tip.text}
    </div>,
    tip.root,
  );
}

// A short label with an (i) that says it in full on hover or focus - "OOO"
// for Out of Order (owner, 2026-10-01).
export default function InfoTip({ label, text }) {
  const [tip, setTip] = useState(null);
  const show = (e) => setTip(tipFor(e.currentTarget, text));
  const hide = () => setTip(null);
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <span
        tabIndex={0}
        role="img"
        aria-label={text}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex cursor-help rounded-full text-(--text-color)/55 hover:text-(--emphasis) focus-visible:text-(--emphasis) focus-visible:outline-2 focus-visible:outline-(--emphasis)"
      >
        <IoInformationCircleOutline size={17} aria-hidden="true" />
      </span>
      <FloatingTip tip={tip} />
    </span>
  );
}

// "OOO" with its (i) - the PMS's one abbreviation for Out of Order. `label`
// is the whole heading ("Rooms OOO", "OOO For").
export const OooLabel = ({ label = "OOO" }) => <InfoTip label={label} text="Out of Order" />;
