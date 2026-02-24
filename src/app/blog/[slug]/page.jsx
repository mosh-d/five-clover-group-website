import Link from "next/link";
import FONTS from "@/utils/fonts";
import { RiArrowLeftLine } from "react-icons/ri";
import { fetchBlogPost } from "@/lib/hashnode";
import StructuredData from "@/components/seo/StructuredData";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/seo/structured-data";

/**
 * Generate dynamic metadata for blog post pages
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await fetchBlogPost(slug);

  if (!blog) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const blogUrl = `/blog/${slug}`;
  // Hashnode images are already absolute URLs, but fallback should be absolute
  const imageUrl = blog.coverImage?.url || 'https://fivecloverhotels.com/og-image.jpg';

  return {
    title: blog.title,
    description: blog.brief || blog.title,
    alternates: {
      canonical: `https://fivecloverhotels.com${blogUrl}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.brief || blog.title,
      type: 'article',
      url: `https://fivecloverhotels.com${blogUrl}`,
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt || blog.publishedAt,
      authors: blog.author?.name ? [blog.author.name] : ['Five Clover Hotels Group'],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.brief || blog.title,
      images: [imageUrl],
    },
  };
}

export default async function FullBlogPage({ params }) {
  const { slug } = await params;
  const blog = await fetchBlogPost(slug);

  if (!blog) {
    return <p className="p-[4rem]">Blog not found.</p>;
  }

  // Generate structured data
  const articleSchema = generateArticleSchema(blog);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: blog.title, url: `/blog/${slug}` },
  ]);

  return (
    <>
      <StructuredData data={[articleSchema, breadcrumbSchema]} />
      <main className="p-[4rem] mt-[12rem] mb-[4rem] max-w-[120rem] mx-auto">
        <Link href="/blog">
          <button className="mb-[2rem] cursor-pointer hover:scale-110 transition-transform">
            <RiArrowLeftLine color="var(--black)" size="3rem" />
          </button>
        </Link>
        <article>
          <h1 className={`${FONTS.heading} mb-[2rem]`}>{blog.title}</h1>
          {blog.coverImage && (
            <img
              src={blog.coverImage.url}
              alt={blog.title}
              className="w-full mt-[2rem] rounded-[1.2rem]"
            />
          )}
          <div
            className="mt-[2rem] font-secondary text-[1.8rem] font-bold leading-relaxed"
            dangerouslySetInnerHTML={{ __html: blog.content.html }}
          />
        </article>
      </main>
    </>
  );
}
