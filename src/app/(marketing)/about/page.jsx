import AboutMainSection from "@/components/about/AboutMainSection";
import Explore from "@/components/about/Explore";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { SEO_KEYWORDS } from "@/lib/seo/constants";

export const metadata = generatePageMetadata({
  title: 'About Us',
  description: 'Learn about Five Clover Hotels Group, our mission to provide premium hospitality across Lagos, Nigeria, and our commitment to exceptional guest experiences.',
  path: '/about',
  keywords: SEO_KEYWORDS.about || ['about Five Clover', 'hotel group Lagos', 'hospitality Nigeria'],
});

export default function AboutPage() {
  return (
    <main>
      <AboutMainSection />
      <Explore />
    </main>
  );
}