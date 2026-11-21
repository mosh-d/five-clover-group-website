// Printing on a phone (owner, 2026-11-21: "printing the branded reports does
// nothing on mobile", then "the print/save as pdf does nothing"): a phone gets
// a PDF it can share or open; a computer keeps the hidden print frame.

vi.mock("./pdf", async (actual) => ({
  ...(await actual()),
  htmlToPdf: vi.fn(async () => ({ blob: new Blob(["%PDF-1.7"], { type: "application/pdf" }), name: "Website Bookings.pdf", landscape: true })),
}));

import { htmlToPdf } from "./pdf";
import { printDocument, printsAsPdf } from "./print";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

function as(ua, { touchPoints = 0 } = {}) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
  Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: touchPoints });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
}

const settle = () => new Promise((r) => setTimeout(r, 0));
const box = () => document.getElementById("pms-pdf-box");
const buttons = () => [...box().querySelectorAll("button, a")].map((b) => b.textContent);

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:pdf");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete navigator.canShare;
  delete navigator.share;
  box()?.remove();
  document.querySelectorAll("[data-print-frame]").forEach((f) => f.remove());
});

describe("printsAsPdf", () => {
  it("is true on a phone and an iPad, false on a computer", () => {
    as(IPHONE);
    expect(printsAsPdf()).toBe(true);
    as("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", { touchPoints: 5 });
    expect(printsAsPdf()).toBe(true);
    as(DESKTOP);
    expect(printsAsPdf()).toBe(false);
  });
});

describe("printDocument on a phone", () => {
  it("makes the PDF and offers Share / Print, which hands the file to the share menu", async () => {
    as(IPHONE);
    navigator.canShare = vi.fn(() => true);
    navigator.share = vi.fn(async () => {});
    printDocument("<html><head><title>Website Bookings</title></head><body>x</body></html>");
    expect(box().textContent).toContain("Making the PDF");
    await settle();
    expect(htmlToPdf).toHaveBeenCalled();
    expect(box().textContent).toContain("Your PDF is ready");
    expect(buttons()).toEqual(["Share / Print", "Open PDF", "Close"]);
    box().querySelector("button").click();
    await settle();
    const shared = navigator.share.mock.calls[0][0];
    expect(shared.files[0].name).toBe("Website Bookings.pdf");
    expect(shared.files[0].type).toBe("application/pdf");
    expect(box()).toBeNull();
    expect(document.querySelector("[data-print-frame]")).toBeNull();
  });

  it("offers Open PDF (a download of the file) where the phone can't share files", async () => {
    as(IPHONE);
    printDocument("<html><body>x</body></html>");
    await settle();
    expect(buttons()).toEqual(["Open PDF", "Close"]);
    const open = box().querySelector("a");
    expect(open.getAttribute("href")).toBe("blob:pdf");
    expect(open.getAttribute("download")).toBe("Website Bookings.pdf");
  });

  it("says so when the PDF can't be made", async () => {
    as(IPHONE);
    htmlToPdf.mockRejectedValueOnce(new Error("Out of memory"));
    printDocument("<html><body>x</body></html>");
    await settle();
    expect(box().textContent).toContain("Couldn't make the PDF");
    expect(box().textContent).toContain("Out of memory");
  });
});

describe("printDocument on a computer", () => {
  it("prints from the hidden frame, making no PDF", () => {
    as(DESKTOP);
    htmlToPdf.mockClear();
    printDocument("<html><head></head><body>x</body></html>");
    expect(htmlToPdf).not.toHaveBeenCalled();
    expect(document.querySelector("[data-print-frame]")).not.toBeNull();
  });
});
