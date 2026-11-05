"use client";

import { Tip } from "@/components/pms/Tip";
import { table } from "@/components/pms/ui";
import { formatDateTime } from "@/lib/pms/format";

// What the store keeper's Requests tab and the Store Requests page share
// (backend docs/INVENTORY-PLAN.md, Step 4).

export const num = (v) => {
  const n = Math.round(Number(v || 0) * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

const STATUS = {
  pending: { label: "Waiting", className: "bg-amber-100 text-amber-800" },
  issued: { label: "Issued", className: "bg-green-100 text-green-700" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700" },
  withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-600" },
};

export function RequestStatus({ request }) {
  const s = STATUS[request.status] || STATUS.pending;
  const part = request.status === "issued" && Number(request.issued_quantity) < Number(request.quantity);
  return (
    <span className="flex flex-col gap-1 items-start">
      <span className={`text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${s.className}`}>
        {s.label}
        {part ? ` ${num(request.issued_quantity)} of ${num(request.quantity)}` : ""}
      </span>
      {request.status === "declined" && request.decline_reason && <span className="text-lg whitespace-normal min-w-[14rem]">{request.decline_reason}</span>}
      {request.decided_by_name && request.status !== "pending" && (
        <span className="text-base text-(--text-color)/60">
          {request.decided_by_name}, {formatDateTime(request.decided_at)}
        </span>
      )}
    </span>
  );
}

/** The list of requests. `actions(request)` renders a row's buttons, or null for none. */
export function RequestsTable({ requests, actions, empty, showOnHand = false }) {
  const anyActions = requests.some((r) => actions(r));
  const head = [
    ["Asked", "inventory.requests.col.when"],
    ["Item", "inventory.requests.col.item"],
    ["For", "inventory.requests.col.department"],
    ["Quantity", "inventory.requests.col.quantity"],
    ...(showOnHand ? [["In the Store", "inventory.requests.col.onHand"]] : []),
    ["Asked By", "inventory.requests.col.by"],
    ["Status", "inventory.requests.col.status"],
    ...(anyActions ? [["Actions", "inventory.requests.col.actions"]] : []),
  ];
  return (
    <div className={table.card}>
      <div className={table.scroll}>
        <table className={table.el}>
          <thead>
            <tr className={table.headRow}>
              {head.map(([label, tip], i) => (
                <th key={label} className={`${table.th} ${i === 0 ? table.stickyTh : ""}`}>
                  {label}
                  <Tip id={tip} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={head.length} className={table.empty}>
                  {empty}
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className={table.row}>
                  <td className={`${table.td} ${table.stickyTd}`}>{formatDateTime(r.created_at)}</td>
                  <td className={`${table.td} whitespace-normal! min-w-[14rem]`}>
                    <span className="font-semibold">{r.item_name}</span>
                    {r.note && <span className="block text-lg text-(--text-color)/68">{r.note}</span>}
                  </td>
                  <td className={table.td}>{r.department_label}</td>
                  <td className={`${table.td} font-semibold`}>
                    {num(r.quantity)} {r.unit}
                  </td>
                  {showOnHand && (
                    <td className={`${table.td} ${r.status === "pending" && r.on_hand < r.quantity ? "text-red-700 font-semibold" : ""}`}>
                      {num(r.on_hand)} {r.unit}
                    </td>
                  )}
                  <td className={table.td}>{r.requested_by_name || "—"}</td>
                  <td className={table.td}>
                    <RequestStatus request={r} />
                  </td>
                  {anyActions && (
                    <td className={table.td}>
                      <div className={table.actions}>{actions(r)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
