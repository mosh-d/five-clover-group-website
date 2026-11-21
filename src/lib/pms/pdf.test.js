import { footerText, isLandscape, pageBreaks, pdfName } from "./pdf";

// The PDF a phone gets (owner, 2026-11-21). A wide report keeps landscape
// pages so it opens the right way up, and pages end between rows.

describe("isLandscape", () => {
  it("follows the sheet's @page size", () => {
    expect(isLandscape("<style>@page { size: A4 landscape; margin: 14mm 12mm 16mm; }</style>")).toBe(true);
    expect(isLandscape("<style>@page { size: A4 portrait; margin: 14mm 12mm 16mm; }</style>")).toBe(false);
    expect(isLandscape("<html><body>receipt</body></html>")).toBe(false);
  });
});

describe("footerText and pdfName", () => {
  it("reads the sheet's page-foot words and title", () => {
    const html = '<title>Website Bookings - Head Office</title><style>@page { size: A4 landscape;\n  @bottom-left { content: "Head Office \\00B7  Website Bookings"; font: 7.5pt Helvetica; } }</style>';
    expect(footerText(html)).toBe("Head Office · Website Bookings");
    expect(pdfName(html)).toBe("Website Bookings - Head Office.pdf");
    expect(pdfName("<title>Receipt 12/3</title>")).toBe("Receipt 12-3.pdf");
    expect(pdfName("<p>x</p>")).toBe("Report.pdf");
  });
});

describe("pageBreaks", () => {
  const spans = (pages) => pages.map((p) => [p.from, p.to]);

  it("is one page when it all fits", () => {
    expect(pageBreaks(500, 1000, [100, 400], [])).toEqual([{ from: 0, to: 500, head: -1 }]);
  });

  it("ends each page at the last row that fits, never inside one", () => {
    // Rows of 30px from 110px down to 2500px.
    const rows = [];
    for (let y = 110; y < 2500; y += 30) rows.push([y, y + 30]);
    const ends = rows.map(([, b]) => b);
    const pages = pageBreaks(2500, 1000, ends, rows);
    expect(spans(pages).slice(0, 2)).toEqual([
      [0, 980],
      [980, 1970],
    ]);
    expect(pages.at(-1).to).toBe(2500);
    for (const { to } of pages.slice(0, -1)) {
      expect(rows.some(([t, b]) => to > t && to < b)).toBe(false);
    }
  });

  it("ignores a block's end that falls inside a table row", () => {
    const rows = [[900, 1100]];
    expect(pageBreaks(3000, 1000, [500, 950, 1100], rows)[0]).toEqual({ from: 0, to: 500, head: -1 });
  });

  it("cuts a block taller than a page where the page runs out", () => {
    expect(spans(pageBreaks(2500, 1000, [2400], []))).toEqual([
      [0, 1000],
      [1000, 2000],
      [2000, 2500],
    ]);
  });

  it("repeats a table's column headings on the pages it runs onto, leaving room for them", () => {
    // Headings 70-100, rows of 30px from 100 to 2800, then the sheet's foot.
    const rows = [];
    for (let y = 100; y < 2800; y += 30) rows.push([y, y + 30]);
    const pages = pageBreaks(3000, 1000, [...rows.map(([, b]) => b), 3000], rows, [{ top: 70, bottom: 100, end: 2800 }]);
    expect(pages[0].head).toBe(-1);
    expect(pages[1]).toEqual({ from: 1000, to: 1960, head: 0 });
    expect(pages[1].to - pages[1].from + 30).toBeLessThanOrEqual(1000);
    expect(pages.at(-1).to).toBe(3000);
  });

  it("joins a sliver of a last page (the sheet's foot) onto the page before", () => {
    const rows = [];
    for (let y = 0; y < 1980; y += 30) rows.push([y, y + 30]);
    const pages = pageBreaks(2060, 1000, [...rows.map(([, b]) => b), 2060], rows);
    expect(spans(pages)).toEqual([
      [0, 990],
      [990, 2060],
    ]);
  });
});
