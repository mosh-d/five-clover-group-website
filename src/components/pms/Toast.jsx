"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";

// A short "done" message, top right just below the top bar, gone after five
// seconds (the branch PMS shows the same after a check-out, a payment...).
// Above every dialog and its blurred backdrop (Modal is z-1000, a dialog
// opened from one z-1100), so a change made in a dialog still shows that it
// worked (owner, 2026-11-04); below only the shift gate and the
// session-ended prompt, which must block the page.
export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div role="status" className="fixed top-[15rem] right-6 z-[2500] bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl flex items-center gap-4 shadow-lg">
      <span className="text-xl font-bold">{message}</span>
      <button onClick={onClose} aria-label="Dismiss" className="text-green-700 hover:text-green-900 cursor-pointer">
        <IoClose size={24} />
      </button>
    </div>
  );
}
