// JSON-LD schema generator functions

import { SITE_CONFIG, HOTELS, SOCIAL_LINKS, LOGO_IMAGE } from './constants';

/**
 * Generate Organization schema
 * @returns {Object} Organization JSON-LD schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}${LOGO_IMAGE.url}`,
    description: SITE_CONFIG.description,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NG',
      addressLocality: 'Lagos',
      addressRegion: 'Lagos State',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE_CONFIG.phone,
      contactType: 'customer service',
      email: SITE_CONFIG.email,
      availableLanguage: ['English'],
    },
    sameAs: [
      SOCIAL_LINKS.facebook,
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.twitter,
      SOCIAL_LINKS.linkedin,
    ],
  };
}

/**
 * Generate Hotel/LocalBusiness schema
 * @param {Object} hotel - Hotel data from constants
 * @returns {Object} Hotel JSON-LD schema
 */
export function generateHotelSchema(hotel) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': `${SITE_CONFIG.url}#${hotel.id}`,
    name: hotel.name,
    description: hotel.description,
    image: `${SITE_CONFIG.url}${hotel.image}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address,
      addressLocality: 'Lagos',
      addressRegion: 'Lagos State',
      addressCountry: 'NG',
    },
    telephone: hotel.phone,
    priceRange: hotel.priceRange,
    starRating: {
      '@type': 'Rating',
      ratingValue: hotel.rating,
      bestRating: '5',
    },
    amenityFeature: hotel.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
    })),
    url: SITE_CONFIG.url,
  };
}

/**
 * Generate multiple hotel schemas
 * @returns {Array} Array of Hotel JSON-LD schemas
 */
export function generateAllHotelsSchema() {
  return HOTELS.map((hotel) => generateHotelSchema(hotel));
}

/**
 * Generate Article/BlogPosting schema
 * @param {Object} article - Article data
 * @param {string} article.title - Article title
 * @param {string} article.brief - Article description
 * @param {Object} [article.coverImage] - Cover image object
 * @param {string} article.publishedAt - Publication date
 * @param {string} [article.updatedAt] - Last update date
 * @param {Object} [article.author] - Author object
 * @param {string} article.slug - Article slug
 * @returns {Object} Article JSON-LD schema
 */
export function generateArticleSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.brief || article.title,
    image: article.coverImage?.url || `${SITE_CONFIG.url}/og-image.jpg`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': article.author?.name ? 'Person' : 'Organization',
      name: article.author?.name || SITE_CONFIG.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}${LOGO_IMAGE.url}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/blog/${article.slug}`,
    },
  };
}

/**
 * Generate BreadcrumbList schema
 * @param {Array} items - Array of breadcrumb items
 * @param {string} items[].name - Breadcrumb name
 * @param {string} items[].url - Breadcrumb URL (relative path)
 * @returns {Object} BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Generate WebSite schema with search action
 * @returns {Object} WebSite JSON-LD schema
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
    },
  };
}
