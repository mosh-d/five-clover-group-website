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

const serverNow = () => new Date(Date.now() + serverClockOffsetMs);

// A Date whose UTC fields read as Lagos's calendar - so getUTC*() below
// gives the Lagos date whatever timezone the device is set to.
const lagosCalendar = (daysFromToday = 0) =>
  new Date(serverNow().getTime() + LAGOS_OFFSET_MINUTES * 60000 + daysFromToday * 86400000);

const isoOf = (d) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

export const todayISO = () => isoOf(lagosCalendar(0));
export const yesterdayISO = () => isoOf(lagosCalendar(-1));
export const monthStartISO = () => `${todayISO().slice(0, 8)}01`;

export const formatShortDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { timeZone: "Africa/Lagos", month: "short", day: "numeric" }) : "N/A";
