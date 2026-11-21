// Printing one thing on its own, not the screen around it (owner, 2026-10-09:
// a receipt printed the whole page - the branch PMS's print stylesheet never
// came across to this PMS). What is printed goes into a hidden frame as a
// document of its own and prints from there: nothing else on the page shows,
// and something long runs over as many sheets as it needs.
//
// A phone or tablet opens it in a new tab instead (owner, 2026-11-21:
// "printing the branded reports does nothing on mobile"). Mobile Safari and
// Chrome on Android don't print a hidden frame - they print the page behind
// it, or nothing. The tab shows the sheet with a Print / Save as PDF bar
// above it (never printed), so it can always be printed or shared from there.

const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A phone or tablet: a touch screen with no mouse, or a mobile browser.
export function printsInNewTab() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS reports itself as a Mac; its touch points give it away.
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const touchOnly = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || ipad || Boolean(touchOnly);
}

/**
 * Opens the tab a phone prints from, at the moment of the tap - a browser
 * only lets a page open a tab while it is handling one. A print that has to
 * load something first (a report fetching its rows) calls this before it
 * waits, and passes what it returns to printDocument. Null on a computer, or
 * when the browser blocked the tab (the hidden frame is used then).
 */
export function openPrintTab() {
  if (!printsInNewTab()) return null;
  const tab = window.open("", "_blank");
  if (!tab) return null;
  try {
    tab.document.write('<!doctype html><title>Preparing...</title><p style="font:16px sans-serif;padding:24px">Preparing...</p>');
  } catch {
    // Some browsers won't let the page write before it has loaded; fine.
  }
  return tab;
}

// The bar above the sheet in the tab: never printed.
const tabBar =
  '<style>.pms-print-bar{position:sticky;top:0;z-index:10;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:12px;background:#f4f1ec;border-bottom:1px solid #ddd6cc;font:600 16px/1.2 Helvetica,Arial,sans-serif}' +
  ".pms-print-bar button{font:inherit;padding:12px 20px;border-radius:10px;border:1px solid #2e2a26;background:#2e2a26;color:#fff;cursor:pointer}" +
  ".pms-print-bar button.pms-close{background:#fff;color:#2e2a26}@media print{.pms-print-bar{display:none!important}}</style>" +
  '<div class="pms-print-bar"><button type="button" onclick="window.print()">Print / Save as PDF</button><button type="button" class="pms-close" onclick="window.close()">Close</button></div>';

// The document for the tab: links resolve against the PMS (the tab starts
// blank), and the bar goes in at the top of its body.
function forTab(html) {
  const base = `<base href="${escapeHtml(window.location.href)}">`;
  let out = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${base}`) : `${base}${html}`;
  out = /<body[^>]*>/i.test(out) ? out.replace(/<body[^>]*>/i, (m) => `${m}${tabBar}`) : `${tabBar}${out}`;
  // A phone lays the sheet out at its own width, not a desktop's.
  if (!/name=["']?viewport/i.test(out)) out = out.replace(base, `${base}<meta name="viewport" content="width=device-width, initial-scale=1">`);
  return out;
}

// Waits for the stylesheets and images a document links to, so the print
// isn't unstyled and no logo prints blank.
function whenLoaded(doc) {
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

// Prints a whole HTML document (a statement of account builds its own).
// `tab`: one openPrintTab gave, when the print had to wait for something.
export function printDocument(html, tab = undefined) {
  const into = tab === undefined ? openPrintTab() : tab;
  if (into && !into.closed) {
    into.document.open();
    into.document.write(forTab(html));
    into.document.close();
    // Straight to the print dialog where the browser allows it; the bar's
    // button is there where it doesn't.
    whenLoaded(into.document).then(() => {
      try {
        into.focus();
        into.print();
      } catch {
        // The bar's button prints it.
      }
    });
    return;
  }
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("data-print-frame", "");
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  whenLoaded(doc).then(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    // Gone once the print dialog has had it.
    setTimeout(() => frame.remove(), 60000);
  });
}

// Prints one element of the page, styled as it is on screen.
export function printElement(element, title = document.title) {
  if (!element) return;
  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join("");
  printDocument(
    `<!doctype html><html class="${escapeHtml(document.documentElement.className)}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${styles}` +
      `<style>body{margin:24px;background:#fff}</style></head><body class="${escapeHtml(document.body.className)}">${element.outerHTML}</body></html>`,
  );
}
