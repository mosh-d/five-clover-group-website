import { applyCorrections, byLine, printableSheet } from "./signedSheet";

// A signed report shows each of the accountant's corrections plainly (owner,
// 2026-11-26: "with a clear message stating it was corrected by the
// accountant") - the old figure kept, an added row marked, a removed row
// struck through but still there.

const sheet = {
  name: "Food Sales",
  title: "Food Sales",
  sections: [
    {
      heading: "Food Sales",
      columns: [{ label: "Item", align: "left" }, { label: "Amount", align: "right" }],
      rows: [
        { cells: [{ text: "Jollof" }, { text: "₦5,000" }] },
        { cells: [{ text: "Rice" }, { text: "₦2,000" }] },
      ],
      totals: [{ label: "Total Sold", value: "₦7,000" }],
    },
  ],
};
const by = { by_name: "ada", at: "2026-11-26T14:40:00Z" };
const corrections = [
  { id: "e1", type: "edit", section: 0, target: "cell", row: 0, col: 1, value: "₦4,500", reason: "Bill 102", ...by },
  { id: "a1", type: "add", section: 0, cells: ["Plantain", "₦1,000"], ...by },
  { id: "d1", type: "delete", section: 0, row: 1, reason: "Rung up twice", ...by },
  { id: "t1", type: "edit", section: 0, target: "total", total: 0, value: "₦5,500", ...by },
  { id: "n1", type: "note", section: null, text: "Bill 102 was rung up wrong.", ...by },
];

it("lays each correction over the report, keeping what it replaced", () => {
  const v = applyCorrections(sheet, corrections);
  const [rows] = [v.sections[0].rows];
  expect(rows[0].cells[1]).toEqual(expect.objectContaining({ text: "₦4,500", was: "₦5,000" }));
  expect(rows[1].removed?.id).toBe("d1");
  expect(rows[2].added?.id).toBe("a1");
  expect(rows[2].cells.map((c) => c.text)).toEqual(["Plantain", "₦1,000"]);
  expect(v.sections[0].totals[0]).toEqual(expect.objectContaining({ value: "₦5,500", was: "₦7,000" }));
  expect(v.notes.map((n) => n.text)).toEqual(["Bill 102 was rung up wrong."]);
  expect(v.count).toEqual({ notes: 1, corrections: 4 });
  // The report itself is left as it was.
  expect(sheet.sections[0].rows[0].cells[1].text).toBe("₦5,000");
});

it("prints every correction plainly, with who and when", () => {
  const p = printableSheet(applyCorrections(sheet, corrections), "Signed off by ada");
  expect(p.sections[0].rows[0].cells[1].text).toBe("₦4,500 (was ₦5,000)");
  expect(p.sections[0].rows[1].cells[0].text).toBe("[Removed] Rice");
  expect(p.sections[0].rows[2].cells[0].text).toBe("[Added] Plantain");
  const signOff = p.sections.at(-1);
  expect(signOff.heading).toBe("Accountant's Sign-Off");
  expect(signOff.note).toContain("Signed off by ada");
  expect(signOff.note).toContain("Food Sales, Amount: ₦5,000 corrected to ₦4,500 - Corrected by the accountant (ada,");
  expect(signOff.note).toContain("Why: Rung up twice");
  expect(byLine("Corrected", { by_name: "ada" })).toBe("Corrected by the accountant (ada)");
});
