import Hero from "@/components/home/Hero";
import HotelIntros from "@/components/home/HotelIntros";
import GroupRelationship from "@/components/home/GroupRelationship";
import Reservation from "@/components/home/Reservation";
import MiniAbout from "@/components/home/MiniAbout";
import Gallery from "@/components/home/Gallery";
import StructuredData from "@/components/seo/StructuredData";
import { generateAllHotelsSchema, generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { SITE_CONFIG, SEO_KEYWORDS, DEFAULT_OG_IMAGE } from "@/lib/seo/constants";

export const metadata = {
  title: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
  description: 'Five Clover Hotels Group offers premium hospitality across Lagos, Nigeria. Book your stay at Five Clover, Caritas Inn, Ring Ruby, or The Cordis hotels.',
  keywords: SEO_KEYWORDS.homepage,
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    title: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
    description: 'Five Clover Hotels Group offers premium hospitality across Lagos, Nigeria. Book your stay at Five Clover, Caritas Inn, Ring Ruby, or The Cordis hotels.',
    url: SITE_CONFIG.url,
    type: 'website',
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
    title: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
    description: 'Five Clover Hotels Group offers premium hospitality across Lagos, Nigeria. Book your stay at Five Clover, Caritas Inn, Ring Ruby, or The Cordis hotels.',
    images: [`${SITE_CONFIG.url}${DEFAULT_OG_IMAGE.url}`],
  },
};

export default function Home() {
  // Generate structured data for all hotels
  const hotelsSchema = generateAllHotelsSchema();
  
  // Generate breadcrumb schema for homepage
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
  ]);

  return (
    <main>
      <StructuredData data={[...hotelsSchema, breadcrumbSchema]} />
      <Hero />
      <HotelIntros />
      <GroupRelationship />
      <Reservation />
      <MiniAbout />
      <Gallery />
    </main>
  );
}
