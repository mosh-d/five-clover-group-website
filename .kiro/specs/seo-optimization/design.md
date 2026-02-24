# SEO Optimization Design Document

## Overview

This design document outlines the implementation strategy for comprehensive SEO optimization of the Five Clover Hotels Group website. The solution leverages Next.js 16's built-in SEO features including the Metadata API, automatic sitemap generation, and server-side rendering capabilities. The design focuses on creating a scalable, maintainable SEO infrastructure that works seamlessly with the existing Hashnode blog integration and hotel content.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Metadata   │  │   Sitemap    │  │  Robots.txt  │      │
│  │     API      │  │  Generator   │  │   Handler    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Structured Data (JSON-LD) Layer          │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Page-Level  │  │  Blog Post   │  │   Shared     │      │
│  │   Metadata   │  │   Metadata   │  │   Metadata   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Hashnode API    │
                  │  (Blog Content)  │
                  └──────────────────┘
```

### Component Structure

```
src/
├── app/
│   ├── layout.jsx                 # Root layout with base metadata
│   ├── page.jsx                   # Homepage with metadata export
│   ├── blog/
│   │   ├── page.jsx              # Blog listing with metadata
│   │   └── [slug]/
│   │       └── page.jsx          # Dynamic blog post with generateMetadata
│   ├── sitemap.js                # Sitemap generator
│   └── robots.js                 # Robots.txt generator
├── lib/
│   ├── seo/
│   │   ├── metadata.js           # Shared metadata utilities
│   │   ├── structured-data.js    # JSON-LD schema generators
│   │   └── constants.js          # SEO constants (site info, URLs)
│   └── hashnode.js               # Hashnode API utilities
└── public/
    ├── favicon.ico
    ├── logo.png
    └── og-image.jpg              # Default Open Graph image
```

## Components and Interfaces

### 1. Metadata Configuration System

#### Base Metadata (Root Layout)

```javascript
// src/app/layout.jsx
export const metadata = {
  metadataBase: new URL('https://fivecloverhotels.com'),
  title: {
    default: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
    template: '%s | Five Clover Hotels Group'
  },
  description: 'Five Clover Hotels Group offers premium hospitality across Lagos, Nigeria. Book your stay at Five Clover, Caritas Inn, Ring Ruby, or The Cordis hotels.',
  keywords: ['hotels in Lagos', 'Lagos hotels', 'Nigeria hotels', 'Five Clover', 'Caritas Inn', 'Ring Ruby', 'The Cordis', 'hotel booking Lagos'],
  authors: [{ name: 'Five Clover Hotels Group' }],
  creator: 'Five Clover Hotels Group',
  publisher: 'Five Clover Hotels Group',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://fivecloverhotels.com',
    siteName: 'Five Clover Hotels Group',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Five Clover Hotels Group',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fivecloverhotels',
    creator: '@fivecloverhotels',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}
```

#### Dynamic Blog Post Metadata

```javascript
// src/app/blog/[slug]/page.jsx
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await fetchBlogPost(slug);
  
  if (!blog) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return {
    title: blog.title,
    description: blog.brief || blog.title,
    openGraph: {
      title: blog.title,
      description: blog.brief,
      type: 'article',
      publishedTime: blog.publishedAt,
      authors: [blog.author?.name],
      images: [
        {
          url: blog.coverImage?.url,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.brief,
      images: [blog.coverImage?.url],
    },
  };
}
```

### 2. Structured Data (JSON-LD) System

#### Structured Data Utilities

```javascript
// src/lib/seo/structured-data.js

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Five Clover Hotels Group',
    url: 'https://fivecloverhotels.com',
    logo: 'https://fivecloverhotels.com/logo.png',
    description: 'Premium hotel group in Lagos, Nigeria',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NG',
      addressLocality: 'Lagos',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+234-XXX-XXX-XXXX',
      contactType: 'customer service',
    },
    sameAs: [
      'https://facebook.com/fivecloverhotels',
      'https://instagram.com/fivecloverhotels',
      'https://twitter.com/fivecloverhotels',
    ],
  };
}

export function generateHotelSchema(hotel) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    description: hotel.description,
    image: hotel.image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address,
      addressLocality: 'Lagos',
      addressCountry: 'NG',
    },
    telephone: hotel.phone,
    priceRange: hotel.priceRange,
    starRating: {
      '@type': 'Rating',
      ratingValue: hotel.rating,
    },
  };
}

export function generateArticleSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.brief,
    image: article.coverImage?.url,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Five Clover Hotels Group',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Five Clover Hotels Group',
      logo: {
        '@type': 'ImageObject',
        url: 'https://fivecloverhotels.com/logo.png',
      },
    },
  };
}

export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
```

#### Structured Data Component

```javascript
// src/components/seo/StructuredData.jsx
export default function StructuredData({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### 3. Sitemap Generation

```javascript
// src/app/sitemap.js
import { fetchHashnodeBlogs } from '@/lib/hashnode';

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
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Dynamic blog posts
  const blogs = await fetchHashnodeBlogs();
  const blogPages = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: new Date(blog.publishedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
```

### 4. Robots.txt Configuration

```javascript
// src/app/robots.js
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://fivecloverhotels.com/sitemap.xml',
  };
}
```

### 5. SEO Constants and Utilities

```javascript
// src/lib/seo/constants.js
export const SITE_CONFIG = {
  name: 'Five Clover Hotels Group',
  url: 'https://fivecloverhotels.com',
  description: 'Premium hospitality across Lagos, Nigeria',
  locale: 'en_NG',
  twitter: '@fivecloverhotels',
};

export const HOTELS = [
  {
    name: 'Five Clover Hotel',
    description: 'Luxury accommodation in the heart of Lagos',
    address: 'Address here',
    phone: '+234-XXX-XXX-XXXX',
    priceRange: '$$$',
    rating: 4.5,
    image: '/hotels/five-clover.jpg',
  },
  // ... other hotels
];
```

```javascript
// src/lib/seo/metadata.js
export function generatePageMetadata({ title, description, path, image }) {
  return {
    title,
    description,
    alternates: {
      canonical: `https://fivecloverhotels.com${path}`,
    },
    openGraph: {
      title,
      description,
      url: `https://fivecloverhotels.com${path}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}
```

### 6. Hashnode API Utilities

```javascript
// src/lib/hashnode.js
export async function fetchHashnodeBlogs() {
  // Existing implementation with caching
  const query = `...`;
  const res = await fetch('https://gql.hashnode.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  // ... rest of implementation
}

export async function fetchBlogPost(slug) {
  const query = `...`;
  const res = await fetch('https://gql.hashnode.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { slug } }),
    next: { revalidate: 3600 },
  });
  // ... rest of implementation
}
```

## Data Models

### Metadata Model

```typescript
interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  alternates?: {
    canonical?: string;
  };
}

interface OpenGraphMetadata {
  title: string;
  description: string;
  type: 'website' | 'article';
  url: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
    alt: string;
  }>;
  publishedTime?: string;
  authors?: string[];
}

interface TwitterMetadata {
  card: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  images: string[];
}
```

### Structured Data Models

```typescript
interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  address: PostalAddress;
  contactPoint: ContactPoint;
  sameAs: string[];
}

interface HotelSchema {
  '@context': 'https://schema.org';
  '@type': 'Hotel';
  name: string;
  description: string;
  image: string;
  address: PostalAddress;
  telephone: string;
  priceRange: string;
  starRating: Rating;
}

interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: Organization;
  publisher: Organization;
}
```

## Error Handling

### Metadata Fallbacks

1. **Missing Blog Post**: If a blog post cannot be fetched, return default metadata with "Blog Post Not Found" title
2. **Missing Images**: If Open Graph images are missing, fall back to default site image
3. **API Failures**: If Hashnode API fails, log error and return empty array for sitemap generation

### Structured Data Validation

1. All structured data must be valid JSON-LD
2. Required fields must have fallback values
3. Invalid schema should be logged but not break page rendering

## Testing Strategy

### Unit Tests

1. **Metadata Generation**
   - Test `generatePageMetadata` with various inputs
   - Test metadata template interpolation
   - Test fallback behavior for missing data

2. **Structured Data**
   - Test each schema generator function
   - Validate JSON-LD output against schema.org specifications
   - Test with missing optional fields

3. **Sitemap Generation**
   - Test static page inclusion
   - Test dynamic blog post inclusion
   - Test with empty blog list
   - Test date formatting

### Integration Tests

1. **Page Metadata**
   - Verify metadata appears in HTML head
   - Test Open Graph tags render correctly
   - Test Twitter Card tags render correctly

2. **Sitemap**
   - Verify sitemap.xml is accessible
   - Validate XML structure
   - Verify all expected URLs are present

3. **Robots.txt**
   - Verify robots.txt is accessible
   - Validate format and directives

### SEO Validation

1. **Google Rich Results Test**: Validate structured data
2. **Facebook Sharing Debugger**: Test Open Graph tags
3. **Twitter Card Validator**: Test Twitter Card tags
4. **Lighthouse SEO Audit**: Achieve score of 95+
5. **Mobile-Friendly Test**: Verify mobile optimization

### Manual Testing Checklist

- [ ] Homepage metadata displays correctly
- [ ] Blog listing metadata displays correctly
- [ ] Individual blog post metadata is dynamic and accurate
- [ ] Open Graph images display in social media previews
- [ ] Sitemap includes all pages
- [ ] Robots.txt is properly formatted
- [ ] Structured data validates in Google Rich Results Test
- [ ] Canonical URLs are correct
- [ ] Mobile viewport is configured
- [ ] Images have alt text

## Performance Considerations

1. **Metadata Generation**: All metadata generation is done at build time or with ISR (Incremental Static Regeneration)
2. **Sitemap Caching**: Sitemap is cached and revalidated every hour
3. **Structured Data**: JSON-LD is inlined in HTML, no additional requests
4. **Image Optimization**: Use Next.js Image component for all images
5. **Font Optimization**: Fonts are already optimized via Google Fonts with display=swap

## Security Considerations

1. **XSS Prevention**: All user-generated content in metadata must be sanitized
2. **Canonical URLs**: Always use HTTPS in canonical URLs
3. **External Links**: Validate Hashnode API responses before using in metadata
4. **Analytics**: Implement analytics with privacy-first approach (consider GDPR)

## Deployment Considerations

1. **Environment Variables**: Store site URL and verification codes in environment variables
2. **Build-Time Generation**: Sitemap and robots.txt are generated at build time
3. **Revalidation**: Blog post metadata revalidates every hour
4. **CDN**: Ensure CDN properly caches sitemap.xml and robots.txt
5. **Domain Configuration**: Update metadataBase when domain changes

## Future Enhancements

1. **Multilingual SEO**: Add hreflang tags for multiple languages
2. **Video Schema**: Add VideoObject schema if video content is added
3. **FAQ Schema**: Add FAQ schema for common questions
4. **Review Schema**: Add review/rating schema when user reviews are implemented
5. **AMP Pages**: Consider AMP versions for blog posts
6. **RSS Feed**: Generate RSS feed for blog posts
7. **Advanced Analytics**: Implement event tracking for conversions
