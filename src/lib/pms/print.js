// Printing one thing on its own, not the screen around it (owner, 2026-10-09:
// a receipt printed the whole page - the branch PMS's print stylesheet never
// came across to this PMS). What is printed goes into a hidden frame as a
// document of its own and prints from there: nothing else on the page shows,
// and something long runs over as many sheets as it needs.

const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Prints a whole HTML document (a statement of account builds its own).
export function printDocument(html) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("data-print-frame", "");
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  // Wait for the stylesheets it links to, so the print isn't unstyled.
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  const loaded = links.map((link) =>
    link.sheet
      ? Promise.resolve()
      : new Promise((done) => {
          link.onload = done;
          link.onerror = done;
          setTimeout(done, 3000);
        }),
  );
  Promise.all(loaded).then(() => {
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
