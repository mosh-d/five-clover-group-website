"use client";

import { field } from "./ui";

// The one date field for every PMS form (the branch PMS's DateInput, owner
// 2026-09-18): the browser's own date input - a phone still gets its native
// picker - but a click anywhere on it opens the calendar, not only the small
// icon at its edge. Where showPicker() is missing or refused (a disabled or
// read-only field), the click does what it always did.
export default function DateInput({ className = field.input, onClick, ...props }) {
  const openCalendar = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || props.disabled || props.readOnly) return;
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // Not allowed here: leave the click alone.
    }
  };
  return <input type="date" {...props} className={`${className} cursor-pointer`} onClick={openCalendar} />;
}
