// Carried over from the branch PMS's utils/guest-tags.js (2026-09-28).
// A guest's tags - VIP, plus the blacklist flag - printed beside their name
// wherever staff meet it, so a VIP or a blacklisted guest is recognised on
// every screen (owner, 2026-09-28). Only these two since 2026-10-02 (owner):
// a tag is for how staff attend to a guest. Corporate and Group had nothing
// behind them, and "walk-in" is how a booking came in (each reservation's
// own source), not something about the guest. The server attaches them to each guest-linked record as
// `guest_tags`, Blacklisted first; see GuestTagsInterceptor in the backend.
// Nothing a guest sees (receipts, emails) carries them.

export const GUEST_TAG_META = {
  blacklisted: { label: "Blacklisted", className: "bg-red-100 text-red-700" },
  vip: { label: "VIP", className: "bg-amber-100 text-amber-800" },
};

// The types staff can tick on a guest's profile, in display order. The
// blacklist is set separately (manager-only, with a reason).
export const GUEST_TYPES = ["vip"];

export const guestTagLabel = (tag) => GUEST_TAG_META[tag]?.label || tag;

// For places that only take text - a <select> option, a tooltip.
export const withGuestTags = (name, tags) =>
  tags?.length ? `${name} (${tags.map(guestTagLabel).join(", ")})` : name;
