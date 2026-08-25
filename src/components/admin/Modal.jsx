"use client";

import { useEffect } from "react";
import { textColorStyle } from "./adminStyles";

// Shared modal shell — closes on ESC or a click on the backdrop itself
// (not its children), same as the hotel-frontends' shared Modal.jsx.
// Every modal in this admin closes this way, confirmations included:
// closing is always equivalent to Cancel, never a destructive action on
// its own, so there's nothing unsafe about dismissing it by clicking out.
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Dialog"}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-bold" style={textColorStyle}>{title}</h2>
          <button onClick={onClose} className="text-4xl leading-none cursor-pointer" style={{ ...textColorStyle, opacity: 0.5 }}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
