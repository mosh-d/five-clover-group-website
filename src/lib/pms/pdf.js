// A printable document (a report sheet, a receipt, a statement) made into a
// real PDF file, for phones and tablets (owner, 2026-11-21: "On mobile, the
// print/save as pdf does nothing"). An iPhone ignores a page's print request
// altogether when the PMS is opened from its home-screen icon, so a phone
// gets the file itself and prints or saves it from its own share menu.
//
// The document is laid out at the width of an A4 page inside a hidden frame,
// drawn page by page (html2canvas-pro), and each page is placed on an A4 page
// of the PDF (jspdf). A sheet laid out landscape (@page size: A4 landscape -
// the wide reports) gets landscape pages, so it opens the right way up
// instead of turned on its side (owner, 2026-11-21). Pages break between
// table rows and blocks, never through one. Both libraries load only when a
// PDF is made.

const MM_PER_PX = 25.4 / 96;
// The report sheet's own @page margins (lib/pms/reportSheet.js), in mm.
const MARGIN = { top: 14, side: 12, bottom: 16 };
// Where a page may end: after one of these, never inside a table row.
const BREAK_AFTER = "tr, header, section, .meta, .subtitle, .figure, .figures, h1, h2, h3, h4, p, li, .note, .totals, .total, .foot, table, img";

// Waits for the stylesheets and images a document links to, so nothing is
// drawn unstyled and no logo comes out blank.
export function whenLoaded(doc) {
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
    link.sheet
      ? Promise.resolve()
      : new Promise((done) => {
          link.onload = done;
          link.onerror = done;
          setTimeout(done, 3000);
        }),
  );
  const images = [...doc.images].map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise((done) => {
          img.onload = done;
          img.onerror = done;
          setTimeout(done, 5000);
        }),
  );
  return Promise.all([...links, ...images]);
}

/** True when the document asks for landscape pages. */
export const isLandscape = (html) => /@page\s*\{[^}]*size:\s*A4\s+landscape/i.test(String(html));

/** The words the sheet prints at the foot of each page, left side ("" if none). */
export function footerText(html) {
  const m = /@bottom-left\s*\{\s*content:\s*"([^"]*)"/i.exec(String(html));
  return m ? m[1].replace(/\\00B7\s?/gi, "· ").replace(/\s+/g, " ").trim() : "";
}

/** A file name from the document's title. */
export function pdfName(html) {
  const raw = /<title>([^<]*)<\/title>/i.exec(String(html))?.[1] || "Report";
  const text = raw.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;|&gt;/g, "");
  const clean = text.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 120);
  return `${clean || "Report"}.pdf`;
}

/**
 * Where each page ends, in px from the top of the document: as near the page
 * height as possible, at the end of a row or block - never inside a table
 * row. `ends` are the bottoms of the places a page may end; `rows` the
 * [top, bottom] of each table row; `heads` each table's column headings
 * ({ top, bottom, end }: the headings' box and the table's bottom), repeated
 * at the top of a page the table runs onto, which leaves that page less room.
 * A block taller than a page is cut where the page runs out, and a last page
 * with only a sliver on it (the sheet's foot) joins the page before, drawn a
 * little smaller. Returns [{ from, to, head }], head the index of the
 * headings to repeat (-1 for none).
 */
export function pageBreaks(total, pageHeight, ends, rows, heads = []) {
  const insideRow = (y) => rows.some(([top, bottom]) => y > top + 0.5 && y < bottom - 0.5);
  const safe = [...new Set(ends.map((y) => Math.round(y * 100) / 100))].filter((y) => y > 0 && y < total && !insideRow(y)).sort((a, b) => a - b);
  const headFor = (y) => (y > 0 ? heads.findIndex((h) => y >= h.bottom - 0.5 && y < h.end - 0.5) : -1);
  const pages = [];
  let from = 0;
  while (total - from > 0.5) {
    const head = headFor(from);
    const room = pageHeight - (head >= 0 ? heads[head].bottom - heads[head].top : 0);
    const limit = from + room;
    if (limit >= total) {
      pages.push({ from, to: total, head });
      break;
    }
    // The last safe end on this page - one that leaves the page at least a
    // quarter full, so a tall block doesn't strand a near-empty page.
    let to = limit;
    for (const y of safe) {
      if (y > limit) break;
      if (y > from + room * 0.25) to = y;
    }
    pages.push({ from, to, head });
    from = to;
  }
  // A sliver left for the last page joins the one before (at most 15% over).
  if (pages.length > 1) {
    const last = pages[pages.length - 1];
    const prev = pages[pages.length - 2];
    const headHeight = prev.head >= 0 ? heads[prev.head].bottom - heads[prev.head].top : 0;
    if (last.head < 0 && last.to - prev.from + headHeight <= pageHeight * 1.15) {
      pages.splice(-2, 2, { from: prev.from, to: last.to, head: prev.head });
    }
  }
  return pages;
}

/**
 * Makes the PDF. Returns { blob, name, landscape }.
 */
export async function htmlToPdf(html) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const landscape = isLandscape(html);
  const pageW = landscape ? 297 : 210;
  const pageH = landscape ? 210 : 297;
  const contentW = pageW - 2 * MARGIN.side;
  const contentH = pageH - MARGIN.top - MARGIN.bottom;
  const widthPx = Math.round(contentW / MM_PER_PX);
  const pageHeightPx = contentH / MM_PER_PX;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("data-pdf-frame", "");
  frame.tabIndex = -1;
  Object.assign(frame.style, { position: "fixed", left: "-20000px", top: "0", width: `${widthPx}px`, height: `${Math.round(pageHeightPx)}px`, border: "0" });
  document.body.appendChild(frame);
  try {
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    await whenLoaded(doc);
    await doc.fonts?.ready;

    const body = doc.body;
    // A sheet wider than the page (a report with many columns) is laid out
    // as wide as it needs and drawn smaller, so nothing is cut off at the
    // right (owner, 2026-11-22: the Status column fell off Every Website
    // Booking). A printer shrinks it to fit the same way.
    let layoutWidth = widthPx;
    for (let i = 0; i < 3; i += 1) {
      const needed = Math.ceil(Math.max(doc.documentElement.scrollWidth, body.scrollWidth));
      if (needed <= layoutWidth + 1) break;
      layoutWidth = needed;
      frame.style.width = `${layoutWidth}px`;
    }
    // Page height and mm per px in the layout's own px.
    const pageHeight = pageHeightPx * (layoutWidth / widthPx);
    const mmPerPx = contentW / layoutWidth;
    const docTables = [...body.querySelectorAll("table")];
    // Each table's columns are pinned to the widths they have, so taking rows
    // out while a page is drawn (below) can't change them.
    const pinned = docTables.map((table) => {
      const plain = [...table.rows].filter((r) => [...r.cells].every((c) => c.colSpan === 1));
      const widest = plain.reduce((best, r) => (!best || r.cells.length > best.cells.length ? r : best), null);
      if (!widest) return null;
      const widths = [...widest.cells].map((c) => c.getBoundingClientRect().width);
      const width = table.getBoundingClientRect().width;
      const colgroup = doc.createElement("colgroup");
      widths.forEach((w) => {
        const col = doc.createElement("col");
        col.style.width = `${w}px`;
        colgroup.appendChild(col);
      });
      table.insertBefore(colgroup, table.firstChild);
      table.style.tableLayout = "fixed";
      table.style.width = `${width}px`;
      return widths.length;
    });

    // Positions are measured from the top of the document - what the
    // drawing crops by - so a body with a margin (a receipt) lines up.
    const top = doc.documentElement.getBoundingClientRect().top;
    const total = Math.max(body.scrollHeight, doc.documentElement.scrollHeight, 1);
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - top, bottom: r.bottom - top };
    };
    const ends = [...body.querySelectorAll(BREAK_AFTER)].map((el) => box(el).bottom);
    const rows = [...body.querySelectorAll("tr")].map((el) => {
      const r = box(el);
      return [r.top, r.bottom];
    });
    const heads = docTables
      .filter((table) => table.tHead)
      .map((table) => ({ ...box(table.tHead), end: box(table).bottom }));
    const pages = pageBreaks(total, pageHeight, ends, rows, heads);
    // Each table's body rows, for slimming the document while a page is drawn.
    const tables = docTables.map((table, i) => ({
      span: pinned[i],
      bodies: [...table.tBodies].map((tb) => ({ bottom: box(tb).bottom, rows: [...tb.rows].map(box) })),
    }));

    const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4", compress: true });
    const foot = footerText(html);
    // Sharp, but never a canvas wider than a phone can draw well.
    const scale = Math.min(window.devicePixelRatio > 1 ? 2 : 1.5, 3000 / layoutWidth);
    // Drawing costs time for every element in the document, however little
    // of it is drawn: a 400-row report took over a minute. So each page is
    // drawn with only its own rows in the document - those above it become
    // one spacer row of the same height and those below are taken out, then
    // all are put back - so nothing on the page moves.
    const spacer = (h, span) => {
      const tr = doc.createElement("tr");
      const td = doc.createElement("td");
      td.colSpan = span;
      td.style.cssText = `height:${h}px;padding:0;border:0;background:transparent`;
      tr.appendChild(td);
      return tr;
    };
    const slim = (y, height) => {
      const end = y + height;
      const restore = [];
      docTables.forEach((table, i) => {
        const t = tables[i];
        if (!t.span) return;
        [...table.tBodies].forEach((tb, j) => {
          const info = t.bodies[j];
          const rows = [...tb.rows];
          if (!info || rows.length !== info.rows.length) return;
          const above = info.rows.filter((r) => r.bottom <= y + 0.5).length;
          const keep = rows.filter((_, k) => info.rows[k].bottom > y + 0.5 && info.rows[k].top < end - 0.5);
          if (keep.length === rows.length) return;
          restore.push(() => tb.replaceChildren(...rows));
          const fill = [];
          if (above) {
            const next = info.rows[above];
            fill.push(spacer((next ? next.top : info.bottom) - info.rows[0].top, t.span));
            // The striped rows keep their stripes: as many spacer rows as
            // rows taken out, odd or even.
            if (above % 2 === 0) fill.push(spacer(0, t.span));
          }
          tb.replaceChildren(...fill, ...keep);
        });
      });
      return () => restore.forEach((fn) => fn());
    };
    // One slice of the document as a JPEG.
    const draw = async (y, height) => {
      const putBack = slim(y, height);
      let canvas;
      try {
        canvas = await html2canvas(doc.documentElement, {
          backgroundColor: "#ffffff",
          scale,
          useCORS: true,
          logging: false,
          x: 0,
          y,
          width: layoutWidth,
          height: Math.max(1, Math.ceil(height)),
          windowWidth: layoutWidth,
          windowHeight: Math.ceil(total),
          scrollX: 0,
          scrollY: 0,
        });
      } finally {
        putBack();
      }
      return canvas.toDataURL("image/jpeg", 0.92);
    };
    const headImages = new Map();
    for (let i = 0; i < pages.length; i += 1) {
      const { from, to, head } = pages[i];
      if (i > 0) pdf.addPage("a4", landscape ? "landscape" : "portrait");
      const h = head >= 0 ? heads[head] : null;
      const headHeight = h ? h.bottom - h.top : 0;
      // A page that took in the last sliver is drawn a little smaller to fit.
      const k = Math.min(1, pageHeight / (to - from + headHeight));
      const width = contentW * k;
      const x = MARGIN.side + (contentW - width) / 2;
      let y = MARGIN.top;
      if (h) {
        if (!headImages.has(head)) headImages.set(head, await draw(h.top, headHeight));
        pdf.addImage(headImages.get(head), "JPEG", x, y, width, headHeight * mmPerPx * k, undefined, "FAST");
        y += headHeight * mmPerPx * k;
      }
      pdf.addImage(await draw(from, to - from), "JPEG", x, y, width, (to - from) * mmPerPx * k, undefined, "FAST");
      if (foot || pages.length > 1) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(138, 129, 120);
        if (foot) pdf.text(foot, MARGIN.side, pageH - 8);
        pdf.text(`Page ${i + 1} of ${pages.length}`, pageW - MARGIN.side, pageH - 8, { align: "right" });
      }
    }
    return { blob: pdf.output("blob"), name: pdfName(html), landscape };
  } finally {
    frame.remove();
  }
}
