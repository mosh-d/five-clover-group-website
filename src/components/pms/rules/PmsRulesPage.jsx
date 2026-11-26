"use client";

import { IoShieldCheckmarkOutline } from "react-icons/io5";
import PageHeader from "@/components/pms/PageHeader";
import { card, page } from "@/components/pms/ui";

// The PMS Rules (owner, 2026-11-26): how every member of staff uses the PMS
// so its reports stay true - written after Ilasan's 25-26 Nov occupancy
// reports didn't match the paper ones (late room moves, one-night bookings
// extended daily, a check-out and re-booking, an out-of-order room only on
// paper). Every role's, at a branch and at Head Office; pinned at the top of
// the sidebar and highlighted.

const RULES = [
  {
    title: "1. The PMS is the record",
    rules: [
      "If it is not in the PMS, it did not happen. Reports, bills, stock and the night audit are built only from what is recorded.",
      "Record it when it happens, not later. The PMS dates everything when it is entered. The PMS Report is taken at exactly 7:00 PM and 7:00 AM, and every other report covers the business day (6:00 AM to 6:00 AM). Something entered late misses its report, or lands on the wrong day.",
      "Use your own sign-in, every time. Never share a password or work on someone else's sign-in. Every action carries your name and the time in the Audit Trail.",
      "Record your shift when you start. A report is credited to the shift on record.",
    ],
  },
  {
    title: "2. Guests and stays",
    rules: [
      "Check a guest in the moment they arrive, into the room they are actually given.",
      "Book the whole stay. If the guest says 3 nights, book 3 nights. Don't book one night and extend every day. The PMS then thinks the guest leaves every day, and the morning report wrongly shows them as Due Out (DO).",
      "When a guest decides to stay longer, use Extend Stay as soon as they tell you. Never check them out and book them again. That makes a stay-over look like a new check-in and splits their bill.",
      "When a guest moves rooms, change it in the PMS when the move happens (Assign Room, or Change Room Type for another type).",
      "Check a guest out when they actually leave, not hours later.",
      "A rate below the room's price needs a true reason, written in plain words.",
    ],
  },
  {
    title: "3. Rooms",
    rules: [
      "Every room is in exactly one state: occupied, vacant, or out of order. The three counts always add up to the rooms in the building.",
      "Out of order: mark it in the PMS with the real reason (e.g. \"AC compressor, no TV\") the moment it is found. Put it back in service when it is fixed. A room out of order only on paper counts as vacant.",
      "Complimentary and manager's rooms must have that status set in the PMS.",
      "Housekeeping marks each room as it is cleaned. The front desk does not give out a room that isn't clean.",
    ],
  },
  {
    title: "4. Money",
    rules: [
      "Record every payment when it is received, with the right method (cash, transfer, POS) and for the right account (Room, F&B or Laundry).",
      "Never record money that hasn't been received, and never hold back money that has.",
      "Refunds, discounts and corrections go through the PMS, never around it. A mistake on a bill is fixed on the folio itself (an adjustment or a refund), with the reason.",
      "F&B and laundry are sold through the PMS at the time of sale. Food or drink goes on a guest's room only when Charge to Room is ticked.",
      "Count your drawer at the end of every shift (Cash-Up). What you count must match what you recorded.",
    ],
  },
  {
    title: "5. Stock",
    rules: [
      "Stock reaches the bar, kitchen and other departments only through Store Requests, issued by the store.",
      "Damaged, returned or missing stock is recorded with its reason the same day. Counts are what is really on the shelf.",
    ],
  },
  {
    title: "6. The business day",
    rules: [
      "The business day runs from 6:00 AM to 6:00 AM. The night audit runs by itself at 6:00 AM and charges every stay-over for the night.",
      "Before 6:00 AM, everything for the day must be in the PMS: check-ins, check-outs, extensions, moves, payments, sales.",
      "Hand over through the Log Book and the Daily Checklist, not by word of mouth alone.",
    ],
  },
  {
    title: "7. Reports",
    rules: [
      "Reports are produced by the PMS. Never rewrite a report by hand to make it look right. If the PMS report is wrong, something was recorded wrongly. Find it and fix it at its source.",
      "The accountant reviews and signs off each report. A correction on the report is marked as the accountant's, and the real mistake is still fixed where it happened.",
    ],
  },
  {
    title: "8. When something goes wrong",
    rules: [
      "Don't work around the PMS. If it won't let you do something, stop and tell your manager. The rule is usually there for a reason.",
      "Own a mistake: correct it the right way, write what happened in the Log Book, and tell your manager.",
    ],
  },
];

export default function PmsRulesPage() {
  return (
    <div className={`${page.wrap} gap-[3rem]!`}>
      <PageHeader
        icon={IoShieldCheckmarkOutline}
        tipId="rules.page"
        title="PMS Rules"
        description="How we use the PMS so every report, bill and count is true. They apply to everyone, at every branch and at Head Office."
      />
      <div className="w-full flex flex-col gap-8 max-w-[96rem]">
        {RULES.map((section) => (
          <section key={section.title} className={`${card.surface} p-8 flex flex-col gap-4 w-full`}>
            <h2 className={page.sectionTitle}>{section.title}</h2>
            <ol className="flex flex-col gap-3 list-[lower-alpha] pl-8">
              {section.rules.map((rule) => (
                <li key={rule} className="text-xl leading-relaxed text-(--text-color)/84 pl-1">
                  {rule}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
