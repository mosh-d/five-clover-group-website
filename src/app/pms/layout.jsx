import PmsShell from "@/components/pms/PmsShell";

// The single PMS for every branch (2026-09-28). An internal tool like the HQ
// admin, so none of the marketing site's chrome, and never indexed.
//
// An installable app (owner, 2026-11-05; docs/OWNER-SETUP.md part 3): the
// manifest (public/pms.webmanifest) and service worker (public/pms-sw.js)
// cover /pms only, so the public website is not an app.
export const metadata = {
  title: "Five Clover Hotels PMS",
  robots: {
    index: false,
    follow: false,
  },
  manifest: "/pms.webmanifest",
  icons: { apple: "/pms-icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Five Clover PMS", statusBarStyle: "black-translucent" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // The page runs edge to edge, so the top bar can sit behind the status bar
  // (PmsTopBar pads itself by the safe area).
  viewportFit: "cover",
  themeColor: "#2b2622",
};

// .pms-type: the PMS's own type sizes, not the public site's minimums
// (globals.css). display: contents, so it adds nothing to the layout.
export default function PmsLayout({ children }) {
  return (
    <div className="pms-type contents">
      <PmsShell>{children}</PmsShell>
    </div>
  );
}
