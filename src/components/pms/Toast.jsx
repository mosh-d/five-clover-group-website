"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";

// A short "done" message, top right just below the top bar, gone after five
// seconds (the branch PMS shows the same after a check-out, a payment...).
export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div role="status" className="fixed top-[15rem] right-6 z-[150] bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl flex items-center gap-4 shadow-lg">
      <span className="text-xl font-bold">{message}</span>
      <button onClick={onClose} aria-label="Dismiss" className="text-green-700 hover:text-green-900 cursor-pointer">
        <IoClose size={24} />
      </button>
    </div>
  );
}
