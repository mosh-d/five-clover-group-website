// Dates for the PMS, in Lagos time and by the SERVER's clock.
//
// A front-desk PC with a wrong clock or timezone would otherwise show the
// wrong day's arrivals and date every report wrongly. The shell measures
// the server's clock once after sign-in (GET /api/front-office/business-date)
// and everything below applies that offset - the branch PMS's rule
// (date-utils.js there). Until the measurement lands, the device clock is
// used, so a failed call degrades to that rather than breaking a page.

const LAGOS_OFFSET_MINUTES = 60; // WAT, UTC+1, no daylight saving
let serverClockOffsetMs = 0;

export function applyServerClock(serverTimeISO) {
  const serverMs = new Date(serverTimeISO).getTime();
  if (Number.isFinite(serverMs)) serverClockOffsetMs = serverMs - Date.now();
}

// How far off this device's clock is, in minutes.
export const deviceClockDriftMinutes = () => Math.round(serverClockOffsetMs / 60000);

// Now, by the server's clock.
export const serverNow = () => new Date(Date.now() + serverClockOffsetMs);

// A Date whose UTC fields read as Lagos's calendar - so getUTC*() below
// gives the Lagos date whatever timezone the device is set to.
const lagosCalendar = (daysFromToday = 0) =>
  new Date(serverNow().getTime() + LAGOS_OFFSET_MINUTES * 60000 + daysFromToday * 86400000);

const isoOf = (d) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

export const todayISO = () => isoOf(lagosCalendar(0));
export const yesterdayISO = () => isoOf(lagosCalendar(-1));
export const monthStartISO = () => `${todayISO().slice(0, 8)}01`;

// Today's BUSINESS date: a hotel day runs 6am to 6am, so before 6am in
// Lagos it is still yesterday - what the server records a walk-in, a charge
// or a shift against (the branch PMS's currentBusinessDateISO).
const BUSINESS_DAY_START_HOUR = 6;
const businessDayShifted = () => new Date(serverNow().getTime() + (LAGOS_OFFSET_MINUTES - BUSINESS_DAY_START_HOUR * 60) * 60000);
export const businessDateISO = () => isoOf(businessDayShifted());

// The earliest valid walk-in checkout: business date + 1 day. Before 6am
// Lagos that is TODAY (a same-day stay is valid - the guest arrived before
// the cutover); from 6am, TOMORROW.
export const minWalkInCheckOutISO = () => isoOf(new Date(businessDayShifted().getTime() + 86400000));

// The date `days` after a YYYY-MM-DD date (before it, for a negative count),
// as YYYY-MM-DD - e.g. the earliest check-out a check-in allows. Worked in
// UTC, so no device timezone can shift a plain date.
export const addDaysISO = (iso, days) => {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : isoOf(new Date(d.getTime() + days * 86400000));
};

// The branch PMS's names for the same days (its utils/date-utils.js), which
// the pages moved over from it use.
export const adminTodayISO = () => todayISO();
export const currentBusinessDateISO = () => businessDateISO();

// Whether noon (Lagos) on a date has passed - the hotel's check-in and
// check-out time. A stay due out "today" isn't due until noon. Stored dates
// are UTC midnight standing for the Lagos calendar date, so noon Lagos is
// that midnight + 11 hours. Mirrors the backend's hasPassedNoonCutoff().
export const hasPassedNoonCutoff = (dateOnly, now = serverNow()) => {
  const d = new Date(dateOnly);
  const dayUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return now.getTime() >= dayUTC + (12 * 60 - LAGOS_OFFSET_MINUTES) * 60000;
};

// How many Lagos calendar days ago a date-only value was: "today",
// "yesterday", "3 days ago". Counted in calendar days, not elapsed hours -
// a check-in from yesterday can be under 24 hours ago and must still read
// "yesterday".
export const calendarDaysAgo = (date) => {
  const d = new Date(date);
  const dateDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const today = lagosCalendar(0);
  const todayDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const diff = Math.round((todayDay - dateDay) / 86400000);
  return diff <= 0 ? "today" : diff === 1 ? "yesterday" : `${diff} days ago`;
};

export const formatShortDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { timeZone: "Africa/Lagos", month: "short", day: "numeric" }) : "N/A";
