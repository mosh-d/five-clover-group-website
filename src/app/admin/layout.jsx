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

export default function AdminLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f2ede4" }}>
      {children}
    </div>
  );
}
