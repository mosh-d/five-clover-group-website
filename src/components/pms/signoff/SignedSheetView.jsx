"use client";

import { IoCreateOutline, IoTrashOutline } from "react-icons/io5";
import { btn, table } from "@/components/pms/ui";
import { byLine } from "@/lib/pms/signedSheet";

// A report under sign-off, drawn with the accountant's corrections on it
// (backend phase-104; lib/pms/signedSheet.js builds the view). Read only for
// the auditor; the accountant's review passes `actions` - each a dialog,
// like every PMS change:
//   editCell(sectionIndex, rowKey, colIndex), editTotal(sectionIndex, totalIndex),
//   addRow(sectionIndex), removeRow(sectionIndex, rowKey), note(sectionIndex).
// A corrected figure shows the new one with the old struck through beside
// it, and says so; an added row is tinted and marked; a removed one stays,
// struck through.

const Tag = ({ tone = "amber", children }) => (
  <span
    className={`inline-block mt-1 text-sm font-semibold rounded-md px-2 py-0.5 whitespace-normal ${
      tone === "green" ? "bg-green-100 text-green-800" : tone === "red" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"
    }`}
  >
    {children}
  </span>
);

function Cell({ cell, onEdit, removed }) {
  const align = cell.align === "right" ? "text-right" : cell.align === "center" ? "text-center" : "text-left";
  return (
    <td className={`${table.td} ${align} align-top whitespace-normal! min-w-[8rem]`}>
      <span className={removed ? "line-through opacity-60" : ""}>
        {cell.edit ? <strong className="text-(--black)">{cell.text || "—"}</strong> : cell.text || "—"}
        {"was" in cell && <span className="ml-2 line-through text-(--text-color)/50">{cell.was || "—"}</span>}
      </span>
      {cell.edit && (
        <span className="block">
          <Tag>{byLine("Corrected", cell.edit)}</Tag>
        </span>
      )}
      {onEdit && !removed && (
        <button type="button" onClick={onEdit} aria-label="Correct this figure" title="Correct this figure" className="ml-1 align-middle p-1 rounded text-(--text-color)/45 hover:text-(--emphasis) hover:bg-black/5 cursor-pointer">
          <IoCreateOutline size={16} aria-hidden="true" />
        </button>
      )}
    </td>
  );
}

export default function SignedSheetView({ view, actions }) {
  return (
    <div className="flex flex-col gap-8">
      {view.notes.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
          <p className="text-lg font-bold uppercase tracking-wide text-amber-900">Accountant&apos;s notes</p>
          {view.notes.map((n) => (
            <p key={n.id} className="text-xl text-amber-950">
              {n.text} <span className="text-base text-amber-800">- {byLine("Noted", n)}</span>
            </p>
          ))}
        </div>
      )}
      {(view.figures || []).length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
          {view.figures.map((f, i) => (
            <div key={i} className="rounded-lg border border-(--accent-2) px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-wide text-(--text-color)/68">{f.label}</p>
              <p className="text-2xl font-bold text-(--black)">{f.value}</p>
              {f.sub && <p className="text-base text-(--text-color)/68">{f.sub}</p>}
            </div>
          ))}
        </div>
      )}
      {view.sections.map((s, si) => (
        <section key={si} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl font-bold text-(--black)">{s.heading || "Section"}</h3>
            {actions && (
              <div className="flex flex-wrap gap-2">
                {s.columns.length > 0 && (
                  <button type="button" className={btn.rowSecondary} onClick={() => actions.addRow(si)}>
                    Add Row
                  </button>
                )}
                <button type="button" className={btn.rowSecondary} onClick={() => actions.note(si)}>
                  Add Note Here
                </button>
              </div>
            )}
          </div>
          {s.notes.map((n) => (
            <p key={n.id} className="text-lg rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-amber-950">
              Note: {n.text} <span className="text-base text-amber-800">- {byLine("Noted", n)}</span>
            </p>
          ))}
          {s.columns.length > 0 ? (
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      {s.columns.map((c, ci) => (
                        <th key={ci} className={`${table.th} ${c.align === "right" ? "text-right!" : ""}`}>
                          {c.label}
                        </th>
                      ))}
                      {actions && <th className={table.th}>Correct</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.length === 0 ? (
                      <tr>
                        <td colSpan={s.columns.length + (actions ? 1 : 0)} className={table.empty}>
                          No rows.
                        </td>
                      </tr>
                    ) : (
                      s.rows.map((r) => (
                        <tr key={r.key} className={`${table.row} ${r.added ? "bg-green-50" : ""} ${r.removed ? "bg-red-50/60" : ""}`}>
                          {r.cells.map((c, ci) => (
                            <Cell key={ci} cell={c} removed={Boolean(r.removed)} onEdit={actions ? () => actions.editCell(si, r.key, ci) : null} />
                          ))}
                          {actions && (
                            <td className={`${table.td} align-top`}>
                              {!r.removed && (
                                <button type="button" onClick={() => actions.removeRow(si, r.key)} aria-label="Remove this row" title="Remove this row" className="p-1.5 rounded text-red-600/70 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                                  <IoTrashOutline size={18} aria-hidden="true" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                    {s.rows
                      .filter((r) => r.added || r.removed)
                      .map((r) => (
                        <tr key={`${r.key}-tag`}>
                          <td colSpan={s.columns.length + (actions ? 1 : 0)} className="px-6 pb-2">
                            {r.added && <Tag tone="green">Row {r.cells[0]?.text ? `"${r.cells[0].text}": ` : ""}{byLine("Added", r.added)}{r.added.reason ? ` - ${r.added.reason}` : ""}</Tag>}
                            {r.removed && <Tag tone="red">Row {r.cells[0]?.text ? `"${r.cells[0].text}": ` : ""}{byLine("Removed", r.removed)}{r.removed.reason ? ` - ${r.removed.reason}` : ""}</Tag>}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            s.note && <p className="text-xl whitespace-pre-line text-(--text-color)/84">{s.note}</p>
          )}
          {s.columns.length > 0 && s.note && <p className="text-lg whitespace-pre-line text-(--text-color)/76">{s.note}</p>}
          {s.totals.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg bg-(--text-color)/4 px-5 py-3">
              {s.totals.map((t, ti) => (
                <div key={ti} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-bold uppercase tracking-wide text-(--text-color)/68">{t.label}</span>
                  <span className="text-2xl font-bold text-(--black)">{t.value}</span>
                  {"was" in t && <span className="text-xl line-through text-(--text-color)/50">{t.was}</span>}
                  {actions && (
                    <button type="button" onClick={() => actions.editTotal(si, ti)} aria-label="Correct this total" title="Correct this total" className="p-1 rounded text-(--text-color)/45 hover:text-(--emphasis) hover:bg-black/5 cursor-pointer">
                      <IoCreateOutline size={16} aria-hidden="true" />
                    </button>
                  )}
                  {t.edit && <Tag>{byLine("Corrected", t.edit)}</Tag>}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
