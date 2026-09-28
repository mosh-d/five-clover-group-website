"use client";

import { useEffect } from "react";
import { IoLockClosedOutline } from "react-icons/io5";
import { btn } from "./ui";

// Shown when the session has ended for good mid-work - nothing on the page
// can succeed any more (the branch PMS's SessionExpiredModal, owner
// 2026-09-27). One way out, on purpose: no close button, no backdrop click,
// no Escape, since dismissing it would leave a page whose every button now
// fails. It says plainly that unsaved work needs redoing, because the
// request that failed carried it.
export default function SessionEndedModal({ onSignIn }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Other dialogs underneath listen for Escape; closing them changes
    // nothing about being signed out.
    const swallowEscape = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", swallowEscape, true);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", swallowEscape, true);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="session-ended-title">
      <div className="bg-(--card) rounded-2xl shadow-xl max-w-xl w-full p-8 flex flex-col items-center gap-5 text-center">
        <span className="w-16 h-16 rounded-full bg-(--emphasis)/10 flex items-center justify-center">
          <IoLockClosedOutline className="text-4xl text-(--emphasis)" />
        </span>
        <h2 id="session-ended-title" className="text-3xl font-bold text-(--black)">Your session has ended</h2>
        <p className="text-xl text-(--text-color)/76">
          You&apos;ve been signed out, so nothing on this page can be saved until you sign in again. Anything you had typed and
          not yet submitted will need to be entered again.
        </p>
        <button onClick={onSignIn} className={btn.primary}>Sign in again</button>
      </div>
    </div>
  );
}
