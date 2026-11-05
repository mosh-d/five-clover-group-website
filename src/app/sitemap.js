// The blog is paused (owner, 2026-11-05) for the move to Cloudflare's free
// plan - see docs/BLOG-PAUSED.md. Its sitemap entries come back with it:
// fetch the posts at BUILD time (no revalidate), as below.
// import { fetchHashnodeBlogs } from '@/lib/hashnode';

/**
 * Generates sitemap for the Five Clover Hotels website: the static pages.
 * @returns {Promise<Array>} Sitemap entries
 */
export default async function sitemap() {
  const baseUrl = 'https://fivecloverhotels.com';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // {
    //   url: `${baseUrl}/blog`,
    //   lastModified: new Date(),
    //   changeFrequency: 'daily',
    //   priority: 0.8,
    // },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  return staticPages;

  // The blog posts, when the blog is back (fetched once, at build time):
  // try {
  //   const blogs = await fetchHashnodeBlogs(100);
  //   const blogPages = blogs.map((blog) => ({
  //     url: `${baseUrl}/blog/${blog.slug}`,
  //     lastModified: new Date(blog.updatedAt || blog.publishedAt),
  //     changeFrequency: 'weekly',
  //     priority: 0.6,
  //   }));
  //   return [...staticPages, ...blogPages];
  // } catch (error) {
  //   console.error('Error generating sitemap:', error);
  //   return staticPages;
  // }
}
