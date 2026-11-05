// PAUSED (owner, 2026-11-05): the leading _ in this folder keeps it from being a route.
// To bring it back, build it at build time - see docs/BLOG-PAUSED.md.
import BlogSection from "@/components/blog/BlogSection";
import { fetchHashnodeBlogs } from "@/lib/hashnode";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { SEO_KEYWORDS } from "@/lib/seo/constants";
import StructuredData from "@/components/seo/StructuredData";

export const metadata = generatePageMetadata({
  title: 'Blog - Five Clover Hotels Group',
  description: 'Stay updated with the latest news, travel tips, and insights from Five Clover Hotels Group. Discover stories about hospitality, Lagos tourism, and hotel industry trends.',
  path: '/blog',
  keywords: SEO_KEYWORDS.blog,
});

export default async function BlogPage() {
  const blogs = await fetchHashnodeBlogs();

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
  ]);

  return (
    <main>
      <StructuredData data={breadcrumbData} />
      <BlogSection blogs={blogs} />
    </main>
  );
}
