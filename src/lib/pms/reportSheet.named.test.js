import { buildReportSheet } from "./reportSheet";

// A sheet named for what it covers (owner, 2026-11-22): "Clock In Report for
// Nov 22, 2026" is the whole name - the heading and the file's - with no
// report, place or dates added.

const sheet = (extra) =>
  buildReportSheet({
    brand: { name: "Five Clover Hotels", hue: 30, emphasis: "#c9a24a" },
    place: "Head Office",
    report: "Booking Attendance",
    title: "Clock In Report for Nov 22, 2026",
    period: "Nov 22, 2026",
    sections: [{ heading: "Today at Every Branch", columns: [], rows: [], totals: [], note: "" }],
    ...extra,
  });

it("names the file by the title alone when named", () => {
  expect(sheet({ named: true })).toContain("<title>Clock In Report for Nov 22, 2026</title>");
  expect(sheet({ named: true })).toContain("<h1>Clock In Report for Nov 22, 2026</h1>");
});

it("otherwise joins the report, title, place and dates, as before", () => {
  expect(sheet()).toContain("<title>Booking Attendance - Clock In Report for Nov 22, 2026 - Head Office - Nov 22, 2026</title>");
});
