import "./globals.css";

import Footer from "@/components/shared/Footer";
import TopBar from "@/components/shared/TopBar";

export const metadata = {
  title: "Five Clover Hotels Group",
  description:
    "Five Clover Hotels Group – Premium hospitality across Lagos, Nigeria. Book your stay at Five Clover, Caritas Inn, Ring Ruby, or The Cordis hotels in Lagos.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TopBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
