import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { storePmsSession, startIdleClock, markActivity, hasBeenIdleTooLong, IDLE_LIMIT_MS } from "../session";
import { renewSession } from "../client";

// The PMS idle clock (owner, 2026-10-02: used last night, still signed in
// this morning). Only signing in starts it and only a click or a key moves
// it - never a renewal, and never a touch after the hour has run out.
const MINUTE = 60 * 1000;
const setStamp = (ms) => localStorage.setItem("pms_last_activity", String(ms));
const stamp = () => Number(localStorage.getItem("pms_last_activity"));
const SESSION = { token: "access", refresh_token: "refresh", user: { staff_role: "receptionist" }, branch: { id: 6 } };

describe("the PMS idle clock", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-02T08:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts afresh when someone signs in, whatever an old session left behind", () => {
    setStamp(Date.now() - 10 * 60 * MINUTE);
    startIdleClock();
    expect(stamp()).toBe(Date.now());
    expect(hasBeenIdleTooLong()).toBe(false);
  });

  it("is not moved by storing a session - every quiet renewal is stored that way", () => {
    setStamp(Date.now() - 40 * MINUTE);
    storePmsSession(SESSION);
    expect(stamp()).toBe(Date.now() - 40 * MINUTE);
  });

  it("is not moved by a renewal, so a tab left open still ends after the hour", async () => {
    setStamp(Date.now() - 40 * MINUTE);
    localStorage.setItem("pms_refresh_token", "refresh");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ...SESSION, token: "renewed" }) })));
    expect(await renewSession()).toBe(true);
    expect(localStorage.getItem("pms_auth_token")).toBe("renewed");
    expect(stamp()).toBe(Date.now() - 40 * MINUTE);
    vi.setSystemTime(Date.now() + 21 * MINUTE);
    expect(hasBeenIdleTooLong()).toBe(true);
  });

  it("is moved by a click or a key within the hour", () => {
    setStamp(Date.now() - 50 * MINUTE);
    markActivity();
    expect(stamp()).toBe(Date.now());
  });

  it("is not moved by a click or a key once the hour has run out - that session stays over", () => {
    const lastNight = Date.now() - 10 * 60 * MINUTE;
    setStamp(lastNight);
    markActivity();
    expect(stamp()).toBe(lastNight);
    expect(hasBeenIdleTooLong()).toBe(true);
  });

  it("runs out just past the hour, not before", () => {
    setStamp(Date.now() - IDLE_LIMIT_MS);
    expect(hasBeenIdleTooLong()).toBe(false);
    setStamp(Date.now() - IDLE_LIMIT_MS - 1);
    expect(hasBeenIdleTooLong()).toBe(true);
  });
});
