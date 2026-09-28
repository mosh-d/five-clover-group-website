import PmsShell from "@/components/pms/PmsShell";

// The single PMS for every branch (2026-09-28). An internal tool like the HQ
// admin, so none of the marketing site's chrome, and never indexed.
export const metadata = {
  title: "Five Clover Hotels PMS",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function PmsLayout({ children }) {
  return <PmsShell>{children}</PmsShell>;
}
