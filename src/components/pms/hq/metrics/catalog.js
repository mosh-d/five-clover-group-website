// The HQ Metrics page's tabs and the metrics under each (owner, 2026-10-01),
// one metric shown at a time. `key` is the server's metric name
// (GET /api/hq/metrics/:key). `snapshot` metrics are as things stand now and
// take no dates; `branchFilter` ones are lists that can be narrowed to one
// branch. `about` says what the figure is for; `how` is how it is counted,
// printed under it.

export const METRIC_TABS = [
  {
    key: "rooms",
    label: "Rooms and Revenue",
    blurb: "The standard hotel scorecard: how full each branch is, what its rooms earn, and where the business comes from.",
    metrics: [
      {
        key: "occupancy",
        label: "Occupancy",
        about: "How full each branch was: room-nights sold against the rooms it had.",
        how: "Room-nights of stays that weren't cancelled or marked no-show, against rooms × days - the same as each branch's Dashboard. Day by day uses the booked dates.",
      },
      {
        key: "adr-revpar",
        label: "ADR and RevPAR",
        about: "ADR is what a room sold for on average; RevPAR is what every room earned, sold or not - the fair way to compare branches of different sizes.",
        how: "Room revenue is the room charges posted for the period, breakfast apart. ADR = room revenue ÷ room-nights sold; RevPAR = room revenue ÷ room-nights available (so RevPAR = ADR × occupancy). A complimentary night counts as sold with no revenue, so it pulls ADR down.",
      },
      {
        key: "trevpar",
        label: "TRevPAR",
        about: "Total revenue per available room: rooms plus breakfast, food, drinks, laundry and non-guest sales.",
        how: "Everything charged in the period (each branch's Dashboard Total Billed, adjustments included) ÷ room-nights available.",
      },
      {
        key: "revenue-mix",
        label: "Revenue Mix",
        about: "What each branch's revenue is made of.",
        how: "Everything charged in the period, split by what it was for. The total is each branch's Dashboard Total Billed. Adjustments and corrections are the amounts taken off bills (or put back).",
      },
      {
        key: "stay-length",
        label: "Length of Stay",
        about: "How long guests stay, and how far ahead website guests book.",
        how: "Stays that began in the period (booked check-in date), not cancelled or no-show. Nights are as booked, after any extension or early departure. Lead time is the days from booking to arrival - website bookings only: a walk-in books on the day, and an OTA guest is booked in at the desk on arrival.",
      },
      {
        key: "channels",
        label: "Booking Channels",
        about: "Where the room business comes from: walk-ins, the website and OTAs.",
        how: "Room and breakfast charged in the period (the total of Revenue by Room Type), by the channel of the stay it was charged to. A stay is OTA when an OTA paid for any of its nights.",
      },
      {
        key: "cancellations",
        label: "Cancellations and No-Shows",
        about: "Bookings that fell through - kept apart from website bookings that were never paid for.",
        how: "Bookings due to arrive in the period. \"Never paid\" are website bookings cancelled automatically because payment never came - a payment problem, not a change of plan. Bookings left half-made at the desk are not counted, and nor are bookings still waiting for payment.",
      },
      {
        key: "discounts",
        label: "Discounting",
        about: "Rooms sold below the standard price, and who sold them.",
        how: "Stays that began in the period: what each was charged against its room type's standard price (breakfast included unless the stay was without it) for the same nights. Under ₦1 of difference is rounding, not a discount. A discount is put against whoever checked the guest in; a website booking's price is the website's. Compared with today's prices.",
      },
      {
        key: "complimentary",
        label: "Complimentary Nights",
        about: "Nights a guest slept with no room charge: complimentary rooms, or a charge that was missed.",
        how: "Completed nights only. A night counts when a guest was in the room overnight and no room charge was posted for it - a complimentary room never is, and a charge put on the bill another way (as a correction, say) shows here too. Each night is worth the room type's standard price. A booking of several rooms where only some are complimentary still posts a charge, so it isn't counted.",
      },
      {
        key: "out-of-order",
        label: "Out of Order Rooms",
        snapshot: true,
        about: "Rooms out of order now, and the bookings they may have cost while out.",
        how: "From Decision Support: for each night a room has been out, a sold-out night is one where its room type sold every room it had for sale, so the room could probably have sold too. Potential loss is a range: the low end counts one room of each type on each of its sold-out nights, the high end every room out that night.",
      },
    ],
  },
  {
    key: "money",
    label: "Money and Credit Control",
    blurb: "Money in and out, what is owed to the hotel and by it, and who gave money back.",
    metrics: [
      {
        key: "collections",
        label: "Collections",
        about: "Money taken, net of refunds and credit refunds, by how it was paid.",
        how: "Every payment and non-guest sale, less refunds and credit paid back out - each branch's total is its Overview \"Collected\" for the same dates. Days are business days, 6am to 6am.",
      },
      {
        key: "outstanding",
        label: "Outstanding Balances",
        snapshot: true,
        about: "What guests and non-guests owe right now, by how long they have owed it.",
        how: "Guests: every open bill with a balance (each branch's Overview \"Outstanding\"), split between guests still in house and guests who have left, by days since they left. Non-guests: open non-guest bills with a balance, which the Overview's figure doesn't include.",
      },
      {
        key: "ota",
        label: "OTA Payments",
        about: "What OTAs still owe, and how long they take to pay.",
        how: "Waiting: OTA payments not yet marked paid, now - days since the nights they cover ended. Received: those marked paid in the period, and the days from the end of those nights to payment.",
      },
      {
        key: "credit-held",
        label: "Credit Held",
        snapshot: true,
        about: "Money paid in that hasn't been spent or given back - the hotel owes it to its guests.",
        how: "Unspent guest credit, by where the stay stands now, plus non-guest credit. Credit for a guest who has left, or on a booking that was cancelled, is listed to chase: refund it or move it to a booking they have.",
      },
      {
        key: "exceptions",
        label: "Exceptions by Staff",
        about: "Every way money was given back or taken off, under whoever did it - where problems usually show first.",
        how: "In the period: refunds and credit refunds (as the Analysis report lists them), adjustments and corrections on bills (the amounts taken off), rates below the standard price (Discounting - stays that began in the period), and food and drink given free (complimentary or manager's, at menu price).",
      },
    ],
  },
  {
    key: "guests",
    label: "Guests",
    blurb: "Who comes back, and whether the hotel can reach its guests.",
    metrics: [
      {
        key: "repeat-guests",
        label: "Repeat Guests",
        about: "Guests who checked in during the period, and how many had stayed with the group before.",
        how: "A guest is their phone number, so the same person at two branches is one guest (and counts once in All Branches). Returning means their first stay anywhere came before this one.",
      },
      {
        key: "top-guests",
        label: "Most Frequent Guests",
        snapshot: true,
        branchFilter: true,
        about: "The group's most loyal guests, all time.",
        how: "Guests with two or more stays, by number of stays, then what their stays were billed. One guest per phone number. All time - the dates don't apply.",
      },
      {
        key: "contactability",
        label: "Contact Details",
        about: "Whether the hotel can reach its guests again - before any marketing.",
        how: "Bookings due to arrive in the period (not cancelled): how many carry a phone number and an email address, and how many emails bounced.",
      },
    ],
  },
  {
    key: "fnb",
    label: "F&B and Stock",
    blurb: "What the restaurant and bar sell, give away and hold.",
    metrics: [
      {
        key: "fnb-sales",
        label: "F&B Sales",
        about: "Food and drink sold, to guests and non-guests, and per room-night.",
        how: "Every food and drink order in the period - the Food and Drink Sales reports' lines, service charge included. Per room-night uses Occupancy's room-nights sold. Breakfast that comes with the room is under Revenue Mix, not here.",
      },
      {
        key: "top-items",
        label: "Best Sellers",
        branchFilter: true,
        about: "The food and drinks that sell most.",
        how: "Orders in the period by item, ranked by sales. \"Given free\" counts complimentary and manager's portions.",
      },
      {
        key: "fnb-comp",
        label: "Complimentary and Manager's",
        about: "Food and drink given away, and what it would have cost.",
        how: "Complimentary orders and manager's consumption in the period (an order that is both counts as the manager's), valued at today's menu price.",
      },
      {
        key: "bar-stock",
        label: "Bar Stock",
        about: "Drinks out of stock or running low, and stock written off.",
        how: "On the shelf now, worked out as the Bar Stock report does: everything added, less everything written off and sold. In the period: units sold, added and written off (damaged, or found missing at a stock count). Running low means under a week's sales left at the period's pace; below zero means more was sold than was ever recorded coming in.",
      },
    ],
  },
  {
    key: "operations",
    label: "Operations and Staff",
    blurb: "Whether the nightly routine runs, who does the work, and how fully each branch uses the PMS.",
    metrics: [
      {
        key: "night-audits",
        label: "Night Audits",
        about: "Whether every night's audit ran, and what it charged.",
        how: "Every completed night in the period. The audit runs by itself at 6am; \"by hand\" means someone ran it from the PMS.",
      },
      {
        key: "staff-activity",
        label: "Staff Activity",
        about: "What each person did: check-ins, check-outs, money taken, F&B orders and shifts.",
        how: "Check-ins, check-outs and money taken as each branch's By Staff section counts them; F&B orders they put through; shifts they picked as on duty. Everyone active at a branch is listed, so someone who did nothing shows too.",
      },
      {
        key: "shifts",
        label: "Shift Coverage",
        about: "Whether every day had a receptionist - and, where a branch has waitrons, a waitron - on record as on duty.",
        how: "The shift each person picks when they start work. Days up to today.",
      },
      {
        key: "alerts",
        label: "Open Alerts",
        snapshot: true,
        about: "Every branch's open alerts, as its Alerts page shows them.",
        how: "Missed check-ins, guests past their check-out, unpaid balances of guests who have left, website bookings awaiting payment, and credit still held for guests who have left.",
      },
      {
        key: "adoption",
        label: "PMS Use by Branch",
        about: "How fully each branch uses the PMS - a branch that records little will understate every other figure here.",
        how: "In the period: bookings, check-ins, payments and F&B orders recorded, staff who did anything, and the days anyone did (up to today). Head office and developer accounts are left out.",
      },
    ],
  },
];

export const ALL_METRICS = METRIC_TABS.flatMap((tab) => tab.metrics.map((m) => ({ ...m, tab: tab.key })));

export const findTab = (key) => METRIC_TABS.find((t) => t.key === key) || METRIC_TABS[0];

export function findMetric(tabKey, metricKey) {
  const tab = findTab(tabKey);
  return tab.metrics.find((m) => m.key === metricKey) || tab.metrics[0];
}

// The tab a metric lives under, for a link that names only the metric.
export const tabOfMetric = (metricKey) => ALL_METRICS.find((m) => m.key === metricKey)?.tab || null;
