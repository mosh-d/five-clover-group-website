// Reusable metadata generation utilities

import { SITE_CONFIG, DEFAULT_OG_IMAGE } from './constants';

/**
 * Generate page metadata with consistent structure
 * @param {Object} options - Metadata options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.path - Page path (e.g., '/blog')
 * @param {string} [options.image] - Open Graph image URL
 * @param {string[]} [options.keywords] - SEO keywords
 * @param {string} [options.type] - Open Graph type (default: 'website')
 * @returns {Object} Next.js metadata object
 */
export function generatePageMetadata({
  title,
  description,
  path,
  image,
  keywords,
  type = 'website',
}) {
  const fullUrl = `${SITE_CONFIG.url}${path}`;
  // Ensure image URL is absolute
  const ogImage = image 
    ? (image.startsWith('http') ? image : `${SITE_CONFIG.url}${image}`)
    : `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE.url}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      type,
      images: [
        {
          url: ogImage,
          width: DEFAULT_OG_IMAGE.width,
          height: DEFAULT_OG_IMAGE.height,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Generate metadata for blog articles
 * @param {Object} article - Article data
 * @param {string} article.title - Article title
 * @param {string} article.brief - Article description/excerpt
 * @param {string} article.slug - Article slug
 * @param {Object} [article.coverImage] - Cover image object
 * @param {string} article.publishedAt - Publication date
 * @param {Object} [article.author] - Author object
 * @returns {Object} Next.js metadata object
 */
export function generateArticleMetadata(article) {
  const fullUrl = `${SITE_CONFIG.url}/blog/${article.slug}`;
  // Ensure image URL is absolute - Hashnode images are already absolute
  const ogImage = article.coverImage?.url || `${SITE_CONFIG.url}${DEFAULT_OG_IMAGE.url}`;

  return {
    title: article.title,
    description: article.brief || article.title,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: article.title,
      description: article.brief || article.title,
      url: fullUrl,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.brief || article.title,
      images: [ogImage],
    },
  };
}

/**
 * Merge custom metadata with defaults
 * @param {Object} customMetadata - Custom metadata to merge
 * @returns {Object} Merged metadata object
 */
export function mergeMetadata(customMetadata) {
  return {
    ...customMetadata,
    metadataBase: new URL(SITE_CONFIG.url),
  };
}

/**
 * Generate absolute URL from relative path
 * @param {string} path - Relative path
 * @returns {string} Absolute URL
 */
export function getAbsoluteUrl(path) {
  return `${SITE_CONFIG.url}${path}`;
}
