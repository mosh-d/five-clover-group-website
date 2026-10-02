import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { businessDateISO, minWalkInCheckOutISO, todayISO, addDaysISO } from "../dates";

// The hotel day starts at 6am Lagos (UTC+1). A walk-in before then counts
// from the night before, so that same calendar day is a valid check-out -
// the 1am arrival leaving by noon (owner, 2026-10-02).
const lagos = (iso) => new Date(`${iso}+01:00`);

describe("the business day and the earliest walk-in check-out", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
  afterEach(() => vi.useRealTimers());

  it.each([
    ["1:00am", "2026-10-03T01:00:00", "2026-10-02", "2026-10-03"],
    ["5:59am", "2026-10-03T05:59:00", "2026-10-02", "2026-10-03"],
    ["6:00am", "2026-10-03T06:00:00", "2026-10-03", "2026-10-04"],
    ["11:30pm", "2026-10-03T23:30:00", "2026-10-03", "2026-10-04"],
  ])("at %s Lagos on Oct 3: business day %s, earliest check-out %s", (_label, at, business, earliest) => {
    vi.setSystemTime(lagos(at));
    expect(todayISO()).toBe("2026-10-03");
    expect(businessDateISO()).toBe(business);
    expect(minWalkInCheckOutISO()).toBe(earliest);
  });
});

describe("addDaysISO", () => {
  it("moves a plain date by whole days, across months and years", () => {
    expect(addDaysISO("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("gives nothing for something that isn't a date", () => {
    expect(addDaysISO("", 1)).toBe("");
  });
});
