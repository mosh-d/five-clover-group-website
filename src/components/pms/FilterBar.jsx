"use client";

import DateInput from "./DateInput";
import LoadingSpinner from "./LoadingSpinner";
import { Tip } from "./Tip";
import { filter } from "./ui";

// The one filter row for every PMS page and report, branch or Head Office
// (owner, 2026-11-27: "a clean, consistent top section for all these date
// pickers/filters/export buttons... nice, compact, clean... one component
// with props"). Fields sit side by side and wrap on a phone; the actions
// (Generate, Export, Print) sit at the row's right end, their bottoms level
// with the fields'. Every label is the same height whether or not it has an
// (i), so the fields under them line up - an (i) used to push its field
// lower than its neighbour's.
//
// <FilterBar actions={<GenerateButton onClick={load} loading={loading} />}>
//   <DateRangeFields from={from} to={to} onFrom={setFrom} onTo={setTo} fromTip="reports.from" toTip="reports.to" />
//   <FilterField label="Branch" tip="hqLogs.branch" htmlFor="branch">
//     <select id="branch" className={filter.select}>...</select>
//   </FilterField>
// </FilterBar>
export default function FilterBar({ children, actions, className = "" }) {
  return (
    <div className={`${filter.bar} ${className}`}>
      {children}
      {actions && <div className={filter.actions}>{actions}</div>}
    </div>
  );
}

// One labelled filter. `wide` lets a search or a long dropdown take more room.
export function FilterField({ label, tip, htmlFor, children, wide = false, className = "" }) {
  return (
    <div className={`${filter.field} ${wide ? filter.wide : ""} ${className}`}>
      <label htmlFor={htmlFor} className={filter.label}>
        {label}
        {tip && <Tip id={tip} />}
      </label>
      {children}
    </div>
  );
}

// A single date. onChange gets the new value ("YYYY-MM-DD", or "" when cleared).
export function DateField({ id, label = "Date", tip, value, onChange, min, max, disabled }) {
  return (
    <FilterField label={label} tip={tip} htmlFor={id} className={filter.date}>
      <DateInput id={id} value={value} min={min} max={max} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={filter.input} />
    </FilterField>
  );
}

// From and To, side by side even on a phone. Picking a From after the To
// moves the To with it, so the range is never backwards; To can't be set
// before From.
export function DateRangeFields({ idPrefix = "range", from, to, onFrom, onTo, min, max, fromTip, toTip, fromLabel = "From", toLabel = "To" }) {
  return (
    <div className={filter.pair}>
      <DateField
        id={`${idPrefix}-from`}
        label={fromLabel}
        tip={fromTip}
        value={from}
        min={min}
        max={max}
        onChange={(v) => {
          onFrom(v);
          if (v && to && v > to) onTo(v);
        }}
      />
      <DateField id={`${idPrefix}-to`} label={toLabel} tip={toTip} value={to} min={from || min} max={max} onChange={onTo} />
    </div>
  );
}

// The report's "Generate Report" (or a page's "Show") button, sized to the fields.
export function GenerateButton({ onClick, loading = false, disabled = false, children = "Generate Report" }) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled} className={filter.primary}>
      {loading && <LoadingSpinner size="sm" light />}
      {children}
    </button>
  );
}
