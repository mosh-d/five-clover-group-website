import InfoTip from "./InfoTip";

// A page's heading: the brand-tinted icon chip and the heading face,
// Playfair Display (.font-accent) - the same on every PMS page, branch or
// Head Office.
// Usage: <PageHeading icon={IoPeopleOutline}>Staff Accounts</PageHeading>
// `tip` puts an (i) beside the title that says an abbreviation in full
// ("OTA Payments": Online Travel Agency).
export default function PageHeading({ icon: Icon, children, badge, tip, className = "" }) {
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      {Icon && (
        <span className="w-[4.4rem] h-[4.4rem] rounded-2xl bg-(--emphasis)/10 text-(--emphasis) flex items-center justify-center shrink-0">
          <Icon size={26} />
        </span>
      )}
      <h1 className="font-accent text-6xl font-bold leading-none text-(--text-color)">{children}</h1>
      {tip && <InfoTip text={tip} size={22} />}
      {badge}
    </div>
  );
}
