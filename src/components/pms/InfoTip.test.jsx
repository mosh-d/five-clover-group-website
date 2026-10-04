import { render, screen } from "@testing-library/react";
import { FloatingTip } from "./InfoTip";

// Where a tip lands (owner, 2026-10-04: long tips ran off the side of a phone,
// and the top bar's off the top of the screen). jsdom has no layout, so the
// window and the tip's own box are given their sizes here.
const VW = 390;
const VH = 800;

function place(anchor, { width = 300, height = 60 } = {}) {
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: VW });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: VH });
  const box = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return this.getAttribute("role") === "tooltip" ? { width, height, left: 0, top: 0, right: width, bottom: height } : box.call(this);
  };
  render(<FloatingTip tip={{ text: "A long tip", anchor, root: document.body }} />);
  HTMLElement.prototype.getBoundingClientRect = box;
  const el = screen.getByRole("tooltip");
  return { left: parseFloat(el.style.left), top: parseFloat(el.style.top), shown: el.style.visibility === "visible" };
}

describe("FloatingTip", () => {
  it("centres on its (i) when there is room, above it", () => {
    const t = place({ left: 190, right: 202, top: 400, bottom: 412 }, { width: 200 });
    expect(t).toEqual({ left: 96, top: 400 - 8 - 60, shown: true });
  });

  it("slides back inside the window near the right edge", () => {
    const t = place({ left: 370, right: 382, top: 400, bottom: 412 });
    expect(t.left).toBe(VW - 8 - 300);
  });

  it("slides back inside the window near the left edge", () => {
    const t = place({ left: 4, right: 16, top: 400, bottom: 412 });
    expect(t.left).toBe(8);
  });

  it("opens below its (i) when there is no room above", () => {
    const t = place({ left: 190, right: 202, top: 20, bottom: 32 });
    expect(t.top).toBe(32 + 8);
  });

  it("stays inside the window when there is room neither above nor below", () => {
    const t = place({ left: 190, right: 202, top: 300, bottom: 312 }, { height: 700 });
    expect(t.top).toBeGreaterThanOrEqual(8);
    expect(t.top + 700).toBeLessThanOrEqual(VH - 8 + 0.001);
  });
});
