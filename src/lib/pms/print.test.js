import { openPrintTab, printDocument, printsInNewTab } from "./print";

// Printing on a phone (owner, 2026-11-21: "printing the branded reports does
// nothing on mobile"): a phone gets the sheet in a new tab with a Print bar;
// a computer keeps the hidden frame.

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

function as(ua, { touchPoints = 0 } = {}) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
  Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: touchPoints });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
}

function fakeTab() {
  let written = "";
  return {
    closed: false,
    focus: vi.fn(),
    print: vi.fn(),
    close: vi.fn(),
    document: {
      open: vi.fn(() => (written = "")),
      write: vi.fn((h) => (written += h)),
      close: vi.fn(),
      querySelectorAll: () => [],
      images: [],
    },
    written: () => written,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.querySelectorAll("[data-print-frame]").forEach((f) => f.remove());
});

describe("printsInNewTab", () => {
  it("is true on a phone and an iPad, false on a computer", () => {
    as(IPHONE);
    expect(printsInNewTab()).toBe(true);
    as("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", { touchPoints: 5 });
    expect(printsInNewTab()).toBe(true);
    as(DESKTOP);
    expect(printsInNewTab()).toBe(false);
  });
});

describe("printDocument", () => {
  it("on a phone writes the sheet into a new tab, with the Print bar, and prints it", async () => {
    as(IPHONE);
    const tab = fakeTab();
    vi.spyOn(window, "open").mockReturnValue(tab);
    printDocument("<!doctype html><html><head><title>R</title></head><body><h1>Sheet</h1></body></html>");
    expect(window.open).toHaveBeenCalledWith("", "_blank");
    const html = tab.written();
    expect(html).toContain("<h1>Sheet</h1>");
    expect(html).toContain("Print / Save as PDF");
    expect(html).toMatch(/<base href=/);
    expect(html).toContain("@media print{.pms-print-bar{display:none!important}}");
    await new Promise((r) => setTimeout(r, 0));
    expect(tab.print).toHaveBeenCalled();
    expect(document.querySelector("[data-print-frame]")).toBeNull();
  });

  it("uses a tab opened earlier (at the tap) rather than opening another", () => {
    as(IPHONE);
    const tab = fakeTab();
    vi.spyOn(window, "open").mockReturnValue(tab);
    const early = openPrintTab();
    expect(early).toBe(tab);
    printDocument("<html><head></head><body>x</body></html>", early);
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(tab.written()).toContain("x");
  });

  it("falls back to the hidden frame when the tab was blocked", () => {
    as(IPHONE);
    vi.spyOn(window, "open").mockReturnValue(null);
    printDocument("<html><head></head><body>x</body></html>");
    expect(document.querySelector("[data-print-frame]")).not.toBeNull();
  });

  it("on a computer prints from the hidden frame, opening no tab", () => {
    as(DESKTOP);
    vi.spyOn(window, "open");
    printDocument("<html><head></head><body>x</body></html>");
    expect(window.open).not.toHaveBeenCalled();
    expect(document.querySelector("[data-print-frame]")).not.toBeNull();
  });
});
