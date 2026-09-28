"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { MotionDiv, backdropEnter, panelEnter } from "./motion";

const WIDTHS = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

// The PMS's dialog - the branch PMS's Modal, on the brand's card colour: a
// header with title/subtitle and close, a scrolling body, and an optional
// footer for actions. Closes on Escape and a backdrop click; closing is
// always the same as Cancel, never an action of its own.
export default function Modal({ onClose, title, subtitle, badge, children, footer, size = "lg", zIndex = 1000 }) {
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
    <MotionDiv
      {...backdropEnter}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Dialog"}
    >
      <MotionDiv {...panelEnter} className={`bg-(--card) rounded-2xl w-full ${WIDTHS[size] || WIDTHS.lg} max-h-[90vh] flex flex-col shadow-2xl overflow-hidden`}>
        <div className="flex items-start justify-between gap-4 px-8 py-6 border-b border-(--accent-2) shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl font-bold text-(--black) leading-tight">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="text-xl text-(--text-color)/76 mt-1">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 p-2 rounded-lg text-(--text-color)/68 hover:text-(--black) hover:bg-black/5 transition-colors cursor-pointer"
            >
              <IoClose size={28} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-8 py-6 flex flex-col gap-8 grow">{children}</div>
        {footer && (
          <div className="px-8 py-5 border-t border-(--accent-2) bg-(--text-color)/3 flex flex-wrap justify-end items-center gap-3 shrink-0">{footer}</div>
        )}
      </MotionDiv>
    </MotionDiv>
  );
}
