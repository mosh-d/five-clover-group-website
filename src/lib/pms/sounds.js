"use client";

// The PMS's sound effects (owner, 2026-11-05) - one system, three families,
// each with its own sound, and these rules for when each plays:
//
// SUCCESS - a short rising pair. Plays when a change this person made has
//   gone through: the server accepted it (any add, save, post, check-in,
//   payment, issue... - every change in the PMS is a request that changes
//   something, and http.js plays this when one succeeds). One per change.
// FAILURE - a low falling pair, clearly not the success sound. Plays when
//   a change this person tried did not go through: the server refused it or
//   couldn't be reached (http.js), or sign-in was refused. A form that
//   stops before sending (a field left empty) shows its message silently.
// ALERT - the bright two-note chime (the one first made for a room sent for
//   review). Plays when something arrives that needs this person, not because
//   of anything they did: rooms to clean or review, a store request waiting,
//   a new website booking, new alerts.
//
// Never: on page loads, navigation, opening or closing a dialog, typing,
// filters, tabs, or refreshes - a sound always means something happened.
// One sound at a time: a second within 350 ms is dropped, and an alert
// repeats at most every 3 s however many arrive.
//
// Each person can turn them off for this device (Account > This Device); a
// browser only plays sound after the page has been clicked or tapped once.
// Sounds are made in the browser (Web Audio) - there are no audio files.

const STORAGE_KEY = "pms.sounds";
export const SOUNDS_CHANGED_EVENT = "pms:sounds-changed";

export const soundsOn = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

export const setSoundsOn = (on) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Private windows may refuse storage; sounds then stay on.
  }
  window.dispatchEvent(new Event(SOUNDS_CHANGED_EVENT));
};

// Each sound: notes of [frequency Hz, start s, length s], a waveform, a level.
const SOUNDS = {
  success: { wave: "sine", level: 0.22, notes: [[660, 0, 0.12], [990, 0.09, 0.2]] },
  failure: { wave: "triangle", level: 0.3, notes: [[392, 0, 0.16], [262, 0.14, 0.3]] },
  alert: { wave: "sine", level: 0.25, notes: [[880, 0, 0.3], [1320, 0.18, 0.3]] },
};

let audio = null;

// iPhones play sound only from an audio channel opened or woken DURING a
// tap - not later, when the server's answer arrives. So every tap opens or
// wakes the channel (a silent blip the first time), and the success, failure
// and alert sounds that follow can play (owner, 2026-11-06: no sound after
// recording a payment). The phone's silent switch still mutes them.
function wakeAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audio) {
      audio = new Ctx();
      const blip = audio.createBuffer(1, 1, 22050);
      const src = audio.createBufferSource();
      src.buffer = blip;
      src.connect(audio.destination);
      src.start(0);
    }
    if (audio.state !== "running") audio.resume().catch(() => {});
  } catch {
    // No sound is fine.
  }
}
if (typeof window !== "undefined") {
  for (const e of ["pointerdown", "touchend", "keydown"]) window.addEventListener(e, wakeAudio, { passive: true, capture: true });
}
let lastAt = 0;
let lastAlertAt = 0;

/** Plays one of "success", "failure", "alert" - following the rules above. */
export function playSound(kind) {
  if (typeof window === "undefined" || !SOUNDS[kind] || !soundsOn()) return;
  const now = Date.now();
  if (now - lastAt < 350) return;
  if (kind === "alert" && now - lastAlertAt < 3000) return;
  lastAt = now;
  if (kind === "alert") lastAlertAt = now;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio = audio || new Ctx();
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const { wave, level, notes } = SOUNDS[kind];
    const t0 = audio.currentTime + 0.01;
    for (const [freq, start, length] of notes) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(level, t0 + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + length);
      osc.connect(gain).connect(audio.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + length + 0.02);
    }
  } catch {
    // No sound is fine - the message on screen still says what happened.
  }
}
