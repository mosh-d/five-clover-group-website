// Mirrors the hotel-frontends' components/shared/StatusBadge.jsx — same
// rounded-pill treatment, extend STYLES as more statuses show up here.
const STYLES = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
};

export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;
  const style = STYLES[String(status).toLowerCase()] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-3 pt-2 pb-2 rounded-full text-lg font-bold capitalize leading-tight whitespace-nowrap ${style} ${className}`}>
      {status}
    </span>
  );
}
