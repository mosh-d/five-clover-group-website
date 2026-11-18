"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";

// A short "done" message, top right just below the top bar, gone after five
// seconds (the branch PMS shows the same after a check-out, a payment...).
// Above every dialog and its blurred backdrop (Modal is z-1000, a dialog
// opened from one z-1100), so a change made in a dialog still shows that it
// worked (owner, 2026-11-04); below only the shift gate and the
// session-ended prompt, which must block the page.
//
// Rendered straight into the PMS's root element (owner, 2026-11-18: "the success popup still
// displays under the blur" after a room price change). Inside the page its
// z-index only counted within whatever layer the page sat in - an animated
// wrapper makes one - so a dialog's backdrop could cover it whatever its
// number. Every page's notices come through here, never a fixed box of its
// own (those sat at the very top, under the iPhone's status-bar blur).
//
// `tone`: "success" (default), or "error" - an error stays until dismissed.
const TONES = {
  success: { box: "bg-green-100 border-green-400 text-green-700", close: "text-green-700 hover:text-green-900" },
  error: { box: "bg-red-100 border-red-400 text-red-700", close: "text-red-700 hover:text-red-900" },
};

export default function Toast({ message, onClose, tone = "success" }) {
  const t = TONES[tone] || TONES.success;
  // The newest onClose, so a page re-rendering (a live update) doesn't
  // restart the five seconds.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!message || tone === "error") return undefined;
    const timer = setTimeout(() => close.current?.(), 5000);
    return () => clearTimeout(timer);
  }, [message, tone]);

  if (!message || typeof document === "undefined") return null;
  return createPortal(
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`fixed top-[15rem] right-6 z-[2500] max-w-[min(32rem,calc(100vw-3rem))] border px-6 py-4 rounded-xl flex items-center gap-4 shadow-lg ${t.box}`}
    >
      <span className="text-xl font-bold">{message}</span>
      <button onClick={onClose} aria-label="Dismiss" className={`shrink-0 cursor-pointer ${t.close}`}>
        <IoClose size={24} />
      </button>
    </div>,
    // The PMS's root (its font and brand colours), outside any page layer.
    [...document.querySelectorAll(".admin-root")].pop() || document.body,
  );
}
