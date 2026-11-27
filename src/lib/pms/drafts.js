"use client";

import { useCallback, useEffect, useState } from "react";
import { DRAFT_PREFIX, currentBranchId, readPmsSession } from "./session";

// Work in progress that outlives the page (owner, 2026-11-27: "if I'm filling
// a form or doing anything, I navigate to another page and go back, I still
// see the work I was doing and the form isn't just cleared" - across reloads
// and app restarts too).
//
// useDraft is useState that remembers: a form's state is kept in this
// browser's localStorage as it is typed, and comes back when the form is
// opened again. Kept apart per signed-in account and per branch, so a
// colleague signing in at the same desk never sees someone else's half-typed
// guest, and a developer switching branches never carries one across.
//
// A draft goes when:
//  - the form goes back to its empty state - which is what every form does
//    once it is saved, so a saved form never comes back as a draft;
//  - the person signs out, or the session ends (clearPmsSession clears every
//    draft: a front-desk PC is shared, and a draft can hold a guest's details);
//  - it is a day old (DRAFT_TTL_MS) - yesterday's half-finished walk-in is
//    not today's.
//
// Only plain values belong in a draft (text, numbers, ids, lists of them) -
// never a photo or file (an ID scan), a password or a card number. A form
// holding one keeps it in its own useState beside the draft.
//
// `key` names the form ("walk-in", "fnb-order"); one that edits a particular
// thing adds its id ("folio-charge:123"). A null key turns it into plain
// useState. `initial` is the form's empty state, or a function returning it.

const PREFIX = DRAFT_PREFIX;
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const storage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

function fullKey(key) {
  if (!key) return null;
  // Read when the form opens, never while the server renders (no storage there).
  const user = typeof window !== "undefined" ? readPmsSession()?.user : null;
  const staff = user?.staff_account_id || user?.id || user?.username;
  if (!staff) return null;
  return `${PREFIX}${staff}:${currentBranchId() || "hq"}:${key}`;
}

const resolve = (initial) => (typeof initial === "function" ? initial() : initial);

function readDraft(storageKey) {
  const store = storage();
  if (!store || !storageKey) return undefined;
  try {
    const saved = JSON.parse(store.getItem(storageKey) || "null");
    if (!saved || typeof saved !== "object" || !("v" in saved)) return undefined;
    if (Date.now() - Number(saved.t || 0) > DRAFT_TTL_MS) {
      store.removeItem(storageKey);
      return undefined;
    }
    return saved.v;
  } catch {
    return undefined;
  }
}

function writeDraft(storageKey, value, emptyJson) {
  const store = storage();
  if (!store || !storageKey) return;
  try {
    const json = JSON.stringify(value);
    if (json === undefined || json === emptyJson) store.removeItem(storageKey);
    else store.setItem(storageKey, JSON.stringify({ v: value, t: Date.now() }));
  } catch {
    // Full or blocked storage: the form still works, it just won't be remembered.
  }
}

/** Forget one draft now (e.g. a form's own Cancel button). */
export function discardDraft(key) {
  const store = storage();
  const k = fullKey(key);
  if (store && k) {
    try {
      store.removeItem(k);
    } catch {
      // Nothing to do.
    }
  }
}

export function useDraft(key, initial) {
  const storageKey = fullKey(key);
  const [state, setState] = useState(() => {
    const saved = readDraft(storageKey);
    return { key: storageKey, value: saved !== undefined ? saved : resolve(initial) };
  });
  // Another record's form (a different key): its own draft, or empty.
  let current = state;
  if (state.key !== storageKey) {
    const saved = readDraft(storageKey);
    current = { key: storageKey, value: saved !== undefined ? saved : resolve(initial) };
    setState(current);
  }
  const emptyJson = JSON.stringify(resolve(initial));
  useEffect(() => {
    writeDraft(current.key, current.value, emptyJson);
  }, [current.key, current.value, emptyJson]);
  const setValue = useCallback((update) => setState((s) => ({ key: s.key, value: typeof update === "function" ? update(s.value) : update })), []);
  return [current.value, setValue];
}
