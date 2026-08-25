import "./globals.css";
import { Cambay, Cormorant } from "next/font/google";

// Marketing chrome (TopBar/Footer), SEO/OG metadata, and analytics all
// moved to src/app/(marketing)/layout.jsx — /admin is a sibling layout
// that needs none of it. Only what's genuinely shared (the document shell,
// fonts) stays here.
const cambay = Cambay({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cambay',
});

const cormorant = Cormorant({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cambay.variable} ${cormorant.variable}`}>
      <body className={cambay.className}>
        {children}
      </body>
    </html>
  );
}
