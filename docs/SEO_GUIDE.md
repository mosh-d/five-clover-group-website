# SEO Guide for Five Clover Hotels Group

This guide provides comprehensive documentation for maintaining and extending the SEO implementation on the Five Clover Hotels Group website.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Metadata Configuration](#metadata-configuration)
4. [Adding New Pages](#adding-new-pages)
5. [Structured Data](#structured-data)
6. [Sitemap and Robots.txt](#sitemap-and-robotstxt)
7. [Image Optimization](#image-optimization)
8. [Testing and Validation](#testing-and-validation)
9. [Maintenance Tasks](#maintenance-tasks)
10. [Troubleshooting](#troubleshooting)

## Overview

The Five Clover Hotels Group website uses Next.js 16's built-in SEO features to provide comprehensive search engine optimization. The implementation includes:

- Dynamic metadata for all pages
- Structured data (JSON-LD) for rich snippets
- Automatic sitemap generation
- Robots.txt configuration
- Open Graph and Twitter Card support
- Canonical URLs
- Google Analytics and Search Console integration

## Environment Variables

The following environment variables are required for full SEO functionality:

### Required Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://fivecloverhotels.com

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Search Console Verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code-here

# Hashnode Blog Configuration
NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST=fivecloverhotels.hashnode.dev
```

### Variable Descriptions

- **NEXT_PUBLIC_SITE_URL**: The production URL of your website (used for canonical URLs and Open Graph tags)
- **NEXT_PUBLIC_GA_MEASUREMENT_ID**: Your Google Analytics 4 measurement ID
- **NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION**: Verification code from Google Search Console
- **NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST**: Your Hashnode publication hostname

### Development vs Production

For local development, you can use:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Ensure production environment variables are set in your deployment platform (Vercel, Netlify, etc.).

## Metadata Configuration

### Base Metadata (Root Layout)

The root layout (`src/app/layout.jsx`) contains the base metadata that applies to all pages:

```javascript
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'Five Clover Hotels Group - Premium Hotels in Lagos, Nigeria',
    template: '%s | Five Clover Hotels Group'
  },
  description: 'Default site description',
  // ... other metadata
}
```

### Page-Specific Metadata

Each page can export its own metadata object:

```javascript
// src/app/your-page/page.jsx
export const metadata = {
  title: 'Your Page Title',
  description: 'Your page description',
  keywords: ['keyword1', 'keyword2'],
  alternates: {
    canonical: '/your-page'
  }
}
```

### Dynamic Metadata

For dynamic pages (like blog posts), use the `generateMetadata` function:

```javascript
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await fetchData(slug);
  
  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      images: [{ url: data.image }]
    }
  };
}
```

## Adding New Pages

When adding a new page to the website, follow these steps to ensure proper SEO:

### Step 1: Create the Page File

Create your page component in the appropriate directory under `src/app/`:

```javascript
// src/app/new-page/page.jsx
export default function NewPage() {
  return (
    <div>
      <h1>Your Page Content</h1>
    </div>
  );
}
```

### Step 2: Add Metadata

Export a metadata object with page-specific information:

```javascript
export const metadata = {
  title: 'New Page Title',
  description: 'A compelling description of your new page (150-160 characters)',
  keywords: ['relevant', 'keywords', 'for', 'this', 'page'],
  alternates: {
    canonical: '/new-page'
  },
  openGraph: {
    title: 'New Page Title',
    description: 'Description for social sharing',
    images: [
      {
        url: '/images/new-page-og.jpg',
        width: 1200,
        height: 630,
        alt: 'New Page Image'
      }
    ]
  }
};
```

### Step 3: Add Structured Data (if applicable)

If your page represents a specific entity (hotel, event, article), add structured data:

```javascript
import StructuredData from '@/components/seo/StructuredData';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';

export default function NewPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://fivecloverhotels.com' },
    { name: 'New Page', url: 'https://fivecloverhotels.com/new-page' }
  ]);

  return (
    <>
      <StructuredData data={breadcrumbs} />
      <div>
        <h1>Your Page Content</h1>
      </div>
    </>
  );
}
```

### Step 4: Update Sitemap

The sitemap automatically includes all static pages. If your page is dynamic, update `src/app/sitemap.js`:

```javascript
export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // Add your new dynamic pages
  const newPages = await fetchNewPageData();
  const dynamicPages = newPages.map((page) => ({
    url: `${baseUrl}/new-page/${page.slug}`,
    lastModified: new Date(page.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...dynamicPages];
}
```

### Step 5: Use Semantic HTML

Ensure your page uses proper semantic HTML structure:

```javascript
export default function NewPage() {
  return (
    <article>
      <header>
        <h1>Main Page Title</h1>
      </header>
      
      <section>
        <h2>Section Title</h2>
        <p>Content...</p>
      </section>
      
      <footer>
        <p>Page footer content</p>
      </footer>
    </article>
  );
}
```

## Structured Data

### Available Schema Generators

The project includes several schema generators in `src/lib/seo/structured-data.js`:

#### Organization Schema

```javascript
import { generateOrganizationSchema } from '@/lib/seo/structured-data';

const orgSchema = generateOrganizationSchema();
```

#### Hotel Schema

```javascript
import { generateHotelSchema } from '@/lib/seo/structured-data';

const hotelSchema = generateHotelSchema({
  name: 'Hotel Name',
  description: 'Hotel description',
  address: 'Street address',
  phone: '+234-XXX-XXX-XXXX',
  priceRange: '$$',
  rating: 4.5,
  image: '/hotels/hotel-image.jpg'
});
```

#### Article Schema

```javascript
import { generateArticleSchema } from '@/lib/seo/structured-data';

const articleSchema = generateArticleSchema({
  title: 'Article Title',
  brief: 'Article description',
  coverImage: { url: '/images/article.jpg' },
  publishedAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z'
});
```

#### Breadcrumb Schema

```javascript
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://fivecloverhotels.com' },
  { name: 'Blog', url: 'https://fivecloverhotels.com/blog' },
  { name: 'Article Title', url: 'https://fivecloverhotels.com/blog/article-slug' }
]);
```

### Adding Structured Data to Pages

Use the `StructuredData` component to add JSON-LD to your pages:

```javascript
import StructuredData from '@/components/seo/StructuredData';

export default function YourPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'YourType',
    // ... schema properties
  };

  return (
    <>
      <StructuredData data={schema} />
      {/* Your page content */}
    </>
  );
}
```

### Creating Custom Schemas

To add a new schema type, create a generator function in `src/lib/seo/structured-data.js`:

```javascript
export function generateEventSchema(event) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    location: {
      '@type': 'Place',
      name: event.locationName,
      address: event.address
    },
    description: event.description,
    image: event.image,
    organizer: {
      '@type': 'Organization',
      name: 'Five Clover Hotels Group',
      url: 'https://fivecloverhotels.com'
    }
  };
}
```

## Sitemap and Robots.txt

### Sitemap Configuration

The sitemap is automatically generated at `/sitemap.xml` by `src/app/sitemap.js`.

#### Sitemap Structure

```javascript
{
  url: 'https://fivecloverhotels.com/page',
  lastModified: new Date(),
  changeFrequency: 'daily', // 'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'
  priority: 1.0, // 0.0 to 1.0
}
```

#### Priority Guidelines

- Homepage: 1.0
- Main sections (Blog, About): 0.8
- Blog posts: 0.6
- Other pages: 0.5

#### Change Frequency Guidelines

- Homepage: daily
- Blog listing: daily
- Blog posts: weekly
- Static pages: monthly

### Robots.txt Configuration

The robots.txt file is generated at `/robots.txt` by `src/app/robots.js`.

#### Current Configuration

```javascript
{
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/api/', '/admin/'],
  },
  sitemap: 'https://fivecloverhotels.com/sitemap.xml',
}
```

#### Blocking Specific Pages

To block specific pages from crawling, add them to the `disallow` array:

```javascript
disallow: ['/api/', '/admin/', '/private-page/']
```

#### Allowing Specific Bots

To configure rules for specific bots:

```javascript
rules: [
  {
    userAgent: 'Googlebot',
    allow: '/',
    disallow: ['/api/'],
  },
  {
    userAgent: 'Bingbot',
    allow: '/',
    disallow: ['/api/', '/admin/'],
  }
]
```

## Image Optimization

### Image Requirements for SEO

1. **Alt Text**: All images must have descriptive alt text
2. **File Names**: Use descriptive, keyword-rich file names
3. **Dimensions**: Specify width and height to prevent layout shift
4. **Format**: Use WebP format when possible for better performance
5. **Size**: Optimize images to be under 200KB when possible

### Using Next.js Image Component

Always use the Next.js Image component for optimal SEO and performance:

```javascript
import Image from 'next/image';

<Image
  src="/images/hotel.jpg"
  alt="Five Clover Hotel lobby with modern decor"
  width={1200}
  height={800}
  priority={false} // Set to true for above-the-fold images
  quality={85}
/>
```

### Open Graph Images

Open Graph images should be:
- Dimensions: 1200x630px
- Format: JPG or PNG
- Size: Under 1MB
- Aspect ratio: 1.91:1

Place Open Graph images in the `public` directory and reference them in metadata:

```javascript
openGraph: {
  images: [
    {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Five Clover Hotels Group'
    }
  ]
}
```

### Image Alt Text Best Practices

- Be descriptive and specific
- Include relevant keywords naturally
- Keep it under 125 characters
- Don't start with "Image of" or "Picture of"
- For decorative images, use empty alt text: `alt=""`

Examples:
```javascript
// Good
<Image src="/hotel.jpg" alt="Five Clover Hotel exterior at sunset" />

// Bad
<Image src="/hotel.jpg" alt="hotel" />
<Image src="/hotel.jpg" alt="Image of a hotel building" />
```

## Testing and Validation

### Pre-Deployment Checklist

Before deploying SEO changes, verify:

- [ ] All pages have unique titles and descriptions
- [ ] Canonical URLs are correct
- [ ] Open Graph images are 1200x630px
- [ ] All images have alt text
- [ ] Structured data validates
- [ ] Sitemap includes all pages
- [ ] Robots.txt is properly configured
- [ ] Mobile viewport is set
- [ ] No broken links

### Testing Tools

#### 1. Google Rich Results Test

Test structured data:
- URL: https://search.google.com/test/rich-results
- Test each page with structured data
- Fix any errors or warnings

#### 2. Facebook Sharing Debugger

Test Open Graph tags:
- URL: https://developers.facebook.com/tools/debug/
- Enter your page URL
- Verify image, title, and description display correctly
- Use "Scrape Again" to refresh cache

#### 3. Twitter Card Validator

Test Twitter Cards:
- URL: https://cards-dev.twitter.com/validator
- Enter your page URL
- Verify card displays correctly

#### 4. Lighthouse SEO Audit

Run Lighthouse in Chrome DevTools:
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "SEO" category
4. Click "Analyze page load"
5. Aim for a score of 95+

#### 5. Google Search Console

Monitor SEO performance:
- URL: https://search.google.com/search-console
- Check for crawl errors
- Monitor search performance
- Submit sitemap
- Request indexing for new pages

#### 6. Mobile-Friendly Test

Test mobile optimization:
- URL: https://search.google.com/test/mobile-friendly
- Enter your page URL
- Fix any mobile usability issues

### Automated Testing

Run the SEO validation script:

```bash
npm run seo-check
```

This script checks:
- Sitemap accessibility
- Robots.txt format
- Metadata presence
- Image alt text
- Canonical URLs

### Manual Testing Commands

```bash
# Check sitemap
curl https://fivecloverhotels.com/sitemap.xml

# Check robots.txt
curl https://fivecloverhotels.com/robots.txt

# Build and test locally
npm run build
npm run start
```

## Maintenance Tasks

### Weekly Tasks

1. **Monitor Search Console**
   - Check for crawl errors
   - Review search performance
   - Address any coverage issues

2. **Check Analytics**
   - Review organic traffic
   - Identify top-performing pages
   - Monitor bounce rates

### Monthly Tasks

1. **Update Content**
   - Refresh outdated content
   - Add new blog posts
   - Update hotel information

2. **Review Keywords**
   - Analyze keyword rankings
   - Update meta descriptions
   - Optimize underperforming pages

3. **Check Backlinks**
   - Monitor new backlinks
   - Disavow spammy links
   - Reach out for link opportunities

### Quarterly Tasks

1. **Comprehensive SEO Audit**
   - Run full Lighthouse audit
   - Check all structured data
   - Review site architecture
   - Update sitemap priorities

2. **Competitor Analysis**
   - Analyze competitor SEO strategies
   - Identify keyword opportunities
   - Review content gaps

3. **Technical SEO Review**
   - Check page load speeds
   - Review mobile usability
   - Optimize Core Web Vitals
   - Update schema markup

### After Adding New Content

1. **Update Metadata**
   - Add unique title and description
   - Include relevant keywords
   - Add Open Graph tags

2. **Add Structured Data**
   - Choose appropriate schema type
   - Validate with Rich Results Test
   - Test social sharing

3. **Submit to Search Engines**
   - Request indexing in Search Console
   - Share on social media
   - Update internal links

## Troubleshooting

### Common Issues and Solutions

#### Issue: Pages Not Appearing in Sitemap

**Solution:**
1. Check if page is in `src/app/sitemap.js`
2. For dynamic pages, verify data fetching works
3. Rebuild the site: `npm run build`
4. Check sitemap at `/sitemap.xml`

#### Issue: Metadata Not Updating

**Solution:**
1. Clear browser cache
2. Rebuild the site: `npm run build`
3. Check if metadata is exported correctly
4. Verify environment variables are set

#### Issue: Structured Data Errors

**Solution:**
1. Validate JSON-LD with Rich Results Test
2. Check for missing required fields
3. Ensure dates are in ISO 8601 format
4. Verify URLs are absolute, not relative

#### Issue: Open Graph Image Not Showing

**Solution:**
1. Verify image is 1200x630px
2. Use absolute URL (include domain)
3. Check image file size (under 1MB)
4. Clear Facebook cache with Sharing Debugger
5. Ensure image is publicly accessible

#### Issue: Low Lighthouse SEO Score

**Common causes:**
- Missing meta description
- Images without alt text
- No viewport meta tag
- Links without descriptive text
- Heading hierarchy issues

**Solution:**
1. Run Lighthouse audit
2. Address each failed audit
3. Re-test until score is 95+

#### Issue: Canonical URL Conflicts

**Solution:**
1. Ensure only one canonical URL per page
2. Use absolute URLs
3. Check for conflicting canonical tags
4. Verify metadataBase is set correctly

#### Issue: Robots.txt Blocking Important Pages

**Solution:**
1. Check `src/app/robots.js` configuration
2. Remove pages from `disallow` array
3. Test with Google Search Console URL Inspection
4. Rebuild and redeploy

### Getting Help

If you encounter issues not covered here:

1. Check Next.js SEO documentation: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
2. Review Google Search Central: https://developers.google.com/search
3. Consult schema.org documentation: https://schema.org
4. Check project issues on GitHub

## Additional Resources

### Documentation

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

### Tools

- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### SEO Best Practices

- Write unique, descriptive titles (50-60 characters)
- Create compelling meta descriptions (150-160 characters)
- Use header tags hierarchically (h1 → h2 → h3)
- Optimize images with alt text and compression
- Build quality backlinks
- Create valuable, original content
- Ensure mobile-friendliness
- Improve page load speed
- Use HTTPS
- Implement structured data

---

**Last Updated:** February 2026

For questions or updates to this documentation, please contact the development team.
