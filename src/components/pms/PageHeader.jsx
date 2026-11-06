import PageHeading from "./PageHeading";
import { page } from "./ui";

// The top of every PMS page (owner, 2026-11-06: one systemic layout). In
// reading order, grouped by what belongs together:
//   1. the title (icon, name, (i), badge) - with the page's own actions
//      (Export, Add...) on the same line on a wide screen, under it on a phone;
//   2. what the page is for, in the smaller description size;
//   3. `children`: the section switches (PageTabs) and filters (page.toolbar).
// A divider and the page's gap set it apart from the content below.
//
// <PageHeader icon={IoReceiptOutline} tipId="folios.page" title="Guest Folios"
//   description="Every folio across all guests, open and closed." actions={<button ...>Export</button>}>
//   <PageTabs ... />
//   <div className={page.toolbar}>...filters...</div>
// </PageHeader>
export default function PageHeader({ icon, tipId, title, badge, description, actions, children }) {
  return (
    <header className={page.header}>
      <div className="w-full flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <PageHeading icon={icon} tipId={tipId} badge={badge}>
          {title}
        </PageHeading>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {description && <p className={page.intro}>{description}</p>}
      {children}
    </header>
  );
}
