// A status pill - reservation, folio, payment and role statuses, coloured as
// the branch PMS colours them (its components/shared/StatusBadge.jsx), so a
// status reads the same in either PMS.
const STYLES = {
  hold: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  open: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-100 text-gray-600",
  applied: "bg-green-100 text-green-700",
  refunded: "bg-red-100 text-red-700",
  occupied: "bg-green-100 text-green-700",
  released: "bg-gray-100 text-gray-600",
  manager: "bg-purple-100 text-purple-700",
  receptionist: "bg-blue-100 text-blue-700",
  developer: "bg-slate-800 text-white",
  accountant: "bg-teal-100 text-teal-700",
  waitron: "bg-amber-100 text-amber-700",
  storekeeper: "bg-orange-100 text-orange-700",
  auto: "bg-slate-100 text-slate-700",
  paid: "bg-green-100 text-green-700",
  owing: "bg-red-100 text-red-700",
  "part paid": "bg-amber-100 text-amber-800",
  pb: "bg-blue-100 text-blue-700",
  complementary: "bg-purple-100 text-purple-700",
  reserved: "bg-indigo-100 text-indigo-700",
  "checked in": "bg-blue-100 text-blue-700",
  "checked out": "bg-gray-100 text-gray-600",
  "stay over": "bg-green-100 text-green-700",
  "checked in & out": "bg-indigo-100 text-indigo-700",
};

export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;
  const style = STYLES[String(status).toLowerCase()] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-3 py-2 rounded-full text-lg font-bold capitalize leading-tight whitespace-nowrap ${style} ${className}`}>
      {status}
    </span>
  );
}
