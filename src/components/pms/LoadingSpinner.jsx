// A spinner in the brand's colour (the branch PMS's LoadingSpinner, which is
// fixed blue) - the one way the PMS shows something loading (owner,
// 2026-10-01: never "Loading..." in words). `light`: white, for a button in
// the brand's colour.
const SIZES = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

export default function LoadingSpinner({ size = "md", light = false, className = "" }) {
  return (
    <div className={`inline-block ${SIZES[size] || SIZES.md} ${className}`} role="status" aria-label="Loading">
      <svg className={`animate-spin h-full w-full ${light ? "text-white" : "text-(--emphasis)"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}
