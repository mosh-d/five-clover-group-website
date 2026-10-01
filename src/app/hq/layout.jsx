import AdminShell from "@/components/admin/AdminShell";

// No marketing chrome (TopBar/Footer), no OG/analytics — this is the HQ
// admin, a separate internal tool, not something the public site's SEO
// metadata should ever describe.
export const metadata = {
  title: "Five Clover HQ Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// AdminShell (a client component) owns the actual chrome — the topbar +
// sidebar shown on every /admin/* page except the /admin login page
// itself, plus the shared "redirect to login if signed out" check. Kept
// separate from this file because `metadata`/`viewport` exports require a
// Server Component, and AdminShell needs usePathname/useRouter.
export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
