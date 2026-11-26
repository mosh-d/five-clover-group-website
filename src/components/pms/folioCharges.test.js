import { accountSummary, chargedToRoom, settlementByAccount } from "./folioCharges";

// Folio accounts (owner, 2026-11-25; backend phase-103): each line's badge
// reads against its own account's money, so food never shows Paid because
// the room was paid for.

const line = (id, item_type, total, account, at) => ({ id, item_type, total, account, created_at: at });

describe("settlementByAccount", () => {
  const folio = {
    items: [
      line(1, "room_charge", 30000, "room", "2026-11-25T10:00:00Z"),
      line(2, "food_charge", 5000, "fnb", "2026-11-25T12:00:00Z"),
      line(3, "drink_charge", 2000, "room", "2026-11-25T13:00:00Z"),
    ],
    accounts: {
      room: { amount_paid: 30000, credit: 60000, balance: -28000 },
      fnb: { amount_paid: 0, credit: 0, balance: 5000 },
      laundry: { amount_paid: 0, credit: 0, balance: 0 },
    },
  };

  it("reads each account against its own money - room credit never marks food paid", () => {
    const s = settlementByAccount(folio);
    expect(s.get(1)).toBe("paid");
    expect(s.get(2)).toBe("owing");
    // Charged to the room: room money pays it.
    expect(s.get(3)).toBe("paid");
  });

  it("is the whole folio's money on an old-way folio", () => {
    const old = { items: folio.items.map((i) => ({ ...i, account: undefined })), total_received: 35000 };
    const s = settlementByAccount(old);
    expect([s.get(1), s.get(2), s.get(3)]).toEqual(["paid", "paid", "owing"]);
  });

  it("tells an order charged to the room apart, and sums one account", () => {
    expect(chargedToRoom(folio.items[2])).toBe(true);
    expect(chargedToRoom(folio.items[1])).toBe(false);
    expect(accountSummary(folio, "fnb")).toEqual({ balance: 5000, charged: 0, paid: 0, credit: 0 });
    expect(accountSummary({ items: [] }, "fnb")).toBeNull();
  });
});
