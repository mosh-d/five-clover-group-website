import ContactMainSection from "@/components/contact/ContactMainSection";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { SEO_KEYWORDS } from "@/lib/seo/constants";

export const metadata = generatePageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with Five Clover Hotels Group. Contact us for reservations, inquiries, or any questions about our hotels in Lagos, Nigeria.',
  path: '/contact',
  keywords: SEO_KEYWORDS.contact || ['contact Five Clover', 'hotel reservations Lagos', 'book hotel Nigeria'],
});

export default function ContactPage() {
    return (
        <main>
            <ContactMainSection />
        </main>
    );
}