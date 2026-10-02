"use client";

import { useState } from "react";
import { field } from "./ui";

// iPhone Safari's picker offers every date, whatever min and max say, and
// nobody types into a date field there - so a pick is a finished choice.
const pickOnly = () => typeof CSS !== "undefined" && CSS.supports?.("-webkit-touch-callout", "none");

// The one date field for every PMS form (the branch PMS's DateInput, owner
// 2026-09-18): the browser's own date input - a phone still gets its native
// picker - but a click anywhere on it opens the calendar, not only the small
// icon at its edge. Where showPicker() is missing or refused (a disabled or
// read-only field), the click does what it always did.
//
// min and max are kept, not just suggested (owner, 2026-10-02: a past
// check-out could be picked, and rooms showed as free for it). A date
// outside them shows in red and moves to the nearest allowed date once the
// person is done with it: when they leave the field, or at once on an
// iPhone. Never mid-typing - a year typed digit by digit passes through
// 0002 and 0020 on its way to 2026. And only a date they changed here: one
// the form came with (an in-house guest's check-in, rightly in the past) is
// left as it is.
export default function DateInput({ className = field.input, onClick, onChange, onBlur, min, max, value, ...props }) {
  const [edited, setEdited] = useState(false);
  const outOfRange = edited && Boolean(value) && ((min && value < min) || (max && value > max));

  const openCalendar = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || props.disabled || props.readOnly) return;
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // Not allowed here: leave the click alone.
    }
  };

  // The nearest date allowed, or null when this one is fine.
  const allowedFor = (picked) => {
    if (!picked) return null;
    const allowed = min && picked < min ? min : max && picked > max ? max : picked;
    return allowed === picked ? null : allowed;
  };
  // Handed to the form as an ordinary change, so its own onChange runs -
  // including whatever it resets when the date moves. Every form reads
  // only e.target.value.
  const moveTo = (input, allowed) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, allowed);
    onChange?.({ target: input, currentTarget: input });
  };

  return (
    <input
      type="date"
      {...props}
      min={min}
      max={max}
      value={value}
      aria-invalid={outOfRange || undefined}
      className={`${className} cursor-pointer${outOfRange ? " border-red-500!" : ""}`}
      onClick={openCalendar}
      onChange={(e) => {
        setEdited(true);
        onChange?.(e);
        // An iPhone pick: moved once this change has been handled.
        if (pickOnly()) {
          const input = e.currentTarget;
          window.setTimeout(() => {
            const allowed = input.isConnected && allowedFor(input.value);
            if (allowed) moveTo(input, allowed);
          }, 0);
        }
      }}
      onBlur={(e) => {
        onBlur?.(e);
        // Leaving the field: moved at once. Whatever took the focus - a
        // date preset, a Save button - acts after this and must see, or
        // replace, the moved date; done later, it overwrote "Last 30 days"
        // with the stale one (2026-10-02).
        const allowed = edited && allowedFor(e.currentTarget.value);
        if (allowed) moveTo(e.currentTarget, allowed);
      }}
    />
  );
}
