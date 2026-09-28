import "./globals.css";
import { Jost, Inter, Playfair_Display } from "next/font/google";

// Marketing chrome (TopBar/Footer), SEO/OG metadata, and analytics all
// moved to src/app/(marketing)/layout.jsx — /admin is a sibling layout
// that needs none of it. Only what's genuinely shared (the document shell,
// fonts) stays here.
//
// The hotel websites' typefaces (owner, 2026-09-21; brought here
// 2026-09-28): Jost for text, Playfair Display for headings, and Inter
// inside the HQ admin and the PMS. See globals.css for where each applies.
const jost = Jost({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jost',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// 400 and 500 only, as on the hotel websites: headings are set at 500, and
// anything asking for bolder gets the real 500 face, never a faux bold.
const playfair = Playfair_Display({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jost.variable} ${inter.variable} ${playfair.variable}`}>
      <body className={jost.className}>
        {children}
      </body>
    </html>
  );
}
