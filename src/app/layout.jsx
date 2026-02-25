import "./globals.css";

import Footer from "@/components/shared/Footer";
import TopBar from "@/components/shared/TopBar";
import LoadingScreen from "@/components/shared/LoadingScreen";
import StructuredData from "@/components/seo/StructuredData";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import { generateOrganizationSchema } from "@/lib/seo/structured-data";
import { SITE_CONFIG, SEO_KEYWORDS, DEFAULT_OG_IMAGE } from "@/lib/seo/constants";

export const metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
    template: '%s | Five Clover Hotels Group',
  },
  description: SITE_CONFIG.description,
  keywords: SEO_KEYWORDS.homepage,
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE.url}`,
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
        alt: DEFAULT_OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitter,
    creator: SITE_CONFIG.twitter,
    title: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
    description: SITE_CONFIG.description,
    images: [`${SITE_CONFIG.url}${DEFAULT_OG_IMAGE.url}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f2ede4',
};

export default function RootLayout({ children }) {
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GoogleAnalytics />
        <StructuredData data={organizationSchema} />
        <LoadingScreen>
          <TopBar />
          {children}
          <Footer />
        </LoadingScreen>
      </body>
    </html>
  );
}
