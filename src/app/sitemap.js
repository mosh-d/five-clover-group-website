import { fetchHashnodeBlogs } from '@/lib/hashnode';

/**
 * Generates sitemap for the Five Clover Hotels website
 * Includes static pages and dynamic blog posts from Hashnode
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
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Fetch dynamic blog posts from Hashnode
  try {
    const blogs = await fetchHashnodeBlogs(100); // Fetch up to 100 blog posts
    
    const blogPages = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date(blog.updatedAt || blog.publishedAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...staticPages, ...blogPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages even if blog fetch fails
    return staticPages;
  }
}
