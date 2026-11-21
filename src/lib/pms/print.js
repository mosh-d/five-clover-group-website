// Printing one thing on its own, not the screen around it (owner, 2026-10-09:
// a receipt printed the whole page - the branch PMS's print stylesheet never
// came across to this PMS). What is printed goes into a hidden frame as a
// document of its own and prints from there: nothing else on the page shows,
// and something long runs over as many sheets as it needs.
//
// A phone or tablet gets a PDF file instead (owner, 2026-11-21: "printing the
// branded reports does nothing on mobile", then "the print/save as pdf does
// nothing" on a print tab). Phone browsers don't print a hidden frame, and an
// iPhone ignores print requests altogether in the home-screen app. The PDF
// (lib/pms/pdf.js) is handed to the phone's own share menu - Print, Save to
// Files, WhatsApp - or opened, from a small box that says when it is ready.

import { htmlToPdf, whenLoaded } from "./pdf";

const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A phone or tablet: a touch screen with no mouse, or a mobile browser.
export function printsAsPdf() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS reports itself as a Mac; its touch points give it away.
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const touchOnly = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || ipad || Boolean(touchOnly);
}

// ---- The "PDF ready" box (plain DOM: this file isn't a component) --------

const BOX_ID = "pms-pdf-box";
const css = {
  shade: "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(20,16,12,.55)",
  card: "width:100%;max-width:420px;background:#fff;color:#2e2a26;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:16px;font:16px/1.45 Helvetica,Arial,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.3)",
  title: "margin:0;font-size:20px;font-weight:700",
  text: "margin:0;color:#5d554d;overflow-wrap:anywhere",
  primary: "font:600 17px Helvetica,Arial,sans-serif;padding:14px 18px;border-radius:10px;border:1px solid #2e2a26;background:#2e2a26;color:#fff;cursor:pointer;text-align:center;text-decoration:none",
  secondary: "font:600 17px Helvetica,Arial,sans-serif;padding:14px 18px;border-radius:10px;border:1px solid #2e2a26;background:#fff;color:#2e2a26;cursor:pointer;text-align:center;text-decoration:none",
  spinner: "width:28px;height:28px;border-radius:50%;border:3px solid #ddd6cc;border-top-color:#2e2a26;animation:pms-pdf-spin .8s linear infinite",
};

function el(tag, style, text) {
  const node = document.createElement(tag);
  if (style) node.style.cssText = style;
  if (text != null) node.textContent = text;
  return node;
}

function openBox() {
  document.getElementById(BOX_ID)?.remove();
  const shade = el("div", css.shade);
  shade.id = BOX_ID;
  const card = el("div", css.card);
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-labelledby", `${BOX_ID}-title`);
  shade.appendChild(card);
  const cleanups = [];
  const close = () => {
    cleanups.forEach((fn) => fn());
    shade.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => e.key === "Escape" && close();
  document.addEventListener("keydown", onKey);

  const show = (heading, message, buttons = [], busy = false) => {
    card.replaceChildren();
    const h = el("h2", css.title, heading);
    h.id = `${BOX_ID}-title`;
    card.appendChild(h);
    if (busy) {
      const style = el("style", null, "@keyframes pms-pdf-spin{to{transform:rotate(360deg)}}");
      card.append(style, el("div", css.spinner));
      card.lastChild.setAttribute("aria-hidden", "true");
    }
    if (message) card.appendChild(el("p", css.text, message));
    buttons.forEach((b) => card.appendChild(b));
    (buttons[0] || card).focus?.();
  };
  const closeButton = (label = "Close") => {
    const b = el("button", css.secondary, label);
    b.type = "button";
    b.onclick = close;
    return b;
  };

  document.body.appendChild(shade);
  return { show, close, closeButton, onClose: (fn) => cleanups.push(fn) };
}

let making = false;

/** Makes the PDF and offers it: Share / Print, Open PDF, Close. */
export async function offerPdf(html) {
  if (making) return;
  making = true;
  const box = openBox();
  box.show("Making the PDF", "This takes a few seconds.", [], true);
  try {
    const { blob, name } = await htmlToPdf(html);
    const file = typeof File === "function" ? new File([blob], name, { type: "application/pdf" }) : null;
    const url = URL.createObjectURL(blob);
    box.onClose(() => setTimeout(() => URL.revokeObjectURL(url), 60000));
    const buttons = [];
    // The phone's share menu has Print and Save to Files. It needs a fresh
    // tap, which is why the box asks for one rather than opening it itself.
    if (file && navigator.canShare?.({ files: [file] })) {
      const share = el("button", css.primary, "Share / Print");
      share.type = "button";
      share.onclick = async () => {
        try {
          await navigator.share({ files: [file], title: name.replace(/\.pdf$/, "") });
          box.close();
        } catch (err) {
          // Closing the share menu is not a failure.
          if (err?.name !== "AbortError") box.show("Couldn't share the PDF", "Use Open PDF instead.", buttons);
        }
      };
      buttons.push(share);
    }
    const open = el("a", buttons.length ? css.secondary : css.primary, "Open PDF");
    open.href = url;
    open.download = name;
    open.target = "_blank";
    open.rel = "noopener";
    buttons.push(open, box.closeButton());
    box.show("Your PDF is ready", name, buttons);
  } catch (err) {
    box.show("Couldn't make the PDF", err?.message || "Something went wrong. Try again.", [box.closeButton()]);
  } finally {
    making = false;
  }
}

// ---- Printing ---------------------------------------------------------------

// Prints a whole HTML document (a statement of account builds its own).
export function printDocument(html) {
  if (printsAsPdf()) {
    offerPdf(html);
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
    `<!doctype html><html class="${escapeHtml(document.documentElement.className)}"><head><meta charset="utf-8"><base href="${escapeHtml(window.location.href)}"><title>${escapeHtml(title)}</title>${styles}` +
      `<style>body{margin:24px;background:#fff}</style></head><body class="${escapeHtml(document.body.className)}">${element.outerHTML}</body></html>`,
  );
}
