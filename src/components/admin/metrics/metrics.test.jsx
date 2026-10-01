import { render, screen, fireEvent } from "@testing-library/react";
import { METRIC_TABS, ALL_METRICS, findMetric, tabOfMetric } from "./catalog";
import { METRIC_VIEWS } from "./views";
import { DataTable } from "./parts";
import { naira, nairaShort, percent, change, presetRange, businessToday, dayText } from "./format";

describe("HQ Metrics catalogue", () => {
  it("has the five tabs the owner named, and a view for every metric", () => {
    expect(METRIC_TABS.map((t) => t.label)).toEqual(["Rooms and Revenue", "Money and Credit Control", "Guests", "F&B and Stock", "Operations and Staff"]);
    expect(ALL_METRICS.map((m) => m.key).sort()).toEqual(Object.keys(METRIC_VIEWS).sort());
    expect(new Set(ALL_METRICS.map((m) => m.key)).size).toBe(ALL_METRICS.length);
    for (const m of ALL_METRICS) {
      expect(m.about).toBeTruthy();
      expect(m.how).toBeTruthy();
    }
  });

  it("falls back to the tab's first metric, and finds a metric's tab from its name alone", () => {
    expect(findMetric("money", "nonsense").key).toBe("collections");
    expect(findMetric("nonsense", "nonsense").key).toBe("occupancy");
    expect(tabOfMetric("bar-stock")).toBe("fnb");
    expect(tabOfMetric("nonsense")).toBeNull();
  });
});

describe("HQ Metrics wording", () => {
  it("writes money as whole naira, a minus for money out, and a dash for nothing to show", () => {
    expect(naira(36955.1)).toBe("₦36,955");
    expect(naira(-246460)).toBe("−₦246,460");
    expect(naira(null)).toBe("—");
    expect(nairaShort(1250000)).toBe("₦1.3M");
    expect(nairaShort(21805055)).toBe("₦22M");
    expect(nairaShort(450400)).toBe("₦450K");
    expect(percent(46.8)).toBe("46.8%");
    expect(percent(null)).toBe("—");
  });

  it("says how a figure moved: points for a percentage, a share for an amount", () => {
    expect(change(46.8, 44.5, "pts")).toEqual({ direction: "up", text: "+2.3 pts" });
    expect(change(36955.1, 37160.1)).toEqual({ direction: "down", text: "−0.6%" });
    expect(change(5, 0)).toEqual({ direction: "up", text: "new" });
    expect(change(null, 3)).toBeNull();
  });

  it("rolls the day over at 6am Lagos, as the branch reports do", () => {
    expect(businessToday(Date.parse("2026-10-02T04:30:00Z"))).toBe("2026-10-01"); // 05:30 Lagos
    expect(businessToday(Date.parse("2026-10-02T05:30:00Z"))).toBe("2026-10-02"); // 06:30 Lagos
  });

  it("offers the usual date ranges", () => {
    expect(presetRange("last-30", "2026-10-01")).toEqual({ from: "2026-09-02", to: "2026-10-01" });
    expect(presetRange("this-month", "2026-10-01")).toEqual({ from: "2026-10-01", to: "2026-10-01" });
    expect(presetRange("last-month", "2026-10-01")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(presetRange("last-month", "2026-01-15")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(presetRange("this-year", "2026-10-01")).toEqual({ from: "2026-01-01", to: "2026-10-01" });
    expect(dayText("2026-09-01")).toMatch(/^1 Sept? 2026$/);
  });
});

describe("the branch table", () => {
  const rows = [
    { branch_id: 4, branch_name: "Ilasan", pct: 3.3, amount: 500 },
    { branch_id: 6, branch_name: "Yaba", pct: 1.1, amount: 1000 },
    { branch_id: 7, branch_name: "Eso", pct: null, amount: 0 },
  ];
  const columns = [
    { key: "pct", label: "Occupancy", value: (r) => r.pct, render: (r) => percent(r.pct), bar: true, barMax: 100, align: "right" },
    { key: "amount", label: "Collected", value: (r) => r.amount, render: (r) => naira(r.amount), bar: true, align: "right" },
  ];
  const first = { label: "Branch", render: (r) => r.branch_name, value: (r) => r.branch_name };
  const bars = (container, row) => [...container.querySelectorAll("tbody tr")[row].querySelectorAll("[aria-hidden='true'] > div")].map((d) => d.style.width);

  it("draws a percentage against 100% and an amount against the largest", () => {
    const { container } = render(<DataTable rows={rows} first={first} columns={columns} defaultSort={{ key: "pct", dir: "desc" }} rowKey={(r) => r.branch_id} />);
    // Ilasan first (3.3%): a 3.3% bar, never a full one; half of Yaba's ₦1,000.
    expect(container.querySelectorAll("tbody tr")[0].textContent).toContain("Ilasan");
    expect(bars(container, 0)).toEqual(["3.3%", "50%"]);
    expect(bars(container, 1)).toEqual(["1.1%", "100%"]);
  });

  it("sorts by a heading, blanks last either way, and says so to screen readers", () => {
    const { container } = render(<DataTable rows={rows} first={first} columns={columns} defaultSort={{ key: "pct", dir: "desc" }} rowKey={(r) => r.branch_id} />);
    const names = () => [...container.querySelectorAll("tbody tr td:first-child")].map((td) => td.textContent);
    expect(names()).toEqual(["Ilasan", "Yaba", "Eso"]);
    fireEvent.click(screen.getByRole("button", { name: /Occupancy/ }));
    expect(names()).toEqual(["Yaba", "Ilasan", "Eso"]);
    expect(screen.getByRole("columnheader", { name: /Occupancy/ }).getAttribute("aria-sort")).toBe("ascending");
  });
});
