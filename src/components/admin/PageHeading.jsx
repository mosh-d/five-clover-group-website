// Page-level heading with a brand-tinted icon chip, matching the style
// already used across the hotel-frontends' admin panels (see
// components/shared/PageHeading.jsx there) — same icon-chip treatment,
// and the same heading face, Playfair Display (via .font-accent).
// Usage: <PageHeading icon={IoPeopleOutline}>Staff Accounts</PageHeading>
export default function PageHeading({ icon: Icon, children, badge, className = "" }) {
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      {Icon && (
        <span className="w-[4.4rem] h-[4.4rem] rounded-2xl bg-(--emphasis)/10 text-(--emphasis) flex items-center justify-center shrink-0">
          <Icon size={26} />
        </span>
      )}
      <h1 className="font-accent text-6xl font-bold leading-none" style={{ color: "var(--text-color)" }}>
        {children}
      </h1>
      {badge}
    </div>
  );
}
