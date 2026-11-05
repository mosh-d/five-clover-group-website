// Built once, at build time - the site is exported as plain files (next.config.mjs).
export const dynamic = 'force-static';

/**
 * Generates robots.txt configuration for the Five Clover Hotels website
 * Controls search engine crawler access and provides sitemap location
 * @returns {Object} Robots.txt configuration
 */
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: 'https://fivecloverhotels.com/sitemap.xml',
  };
}
