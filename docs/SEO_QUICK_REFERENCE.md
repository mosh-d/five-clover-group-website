# SEO Quick Reference

Quick reference guide for common SEO tasks on the Five Clover Hotels Group website.

## Adding Metadata to a New Page

```javascript
// src/app/your-page/page.jsx
export const metadata = {
  title: 'Your Page Title',
  description: 'Your page description (150-160 characters)',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  alternates: {
    canonical: '/your-page'
  },
  openGraph: {
    title: 'Your Page Title',
    description: 'Description for social sharing',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }]
  }
};

export default function YourPage() {
  return <div>Your content</div>;
}
```

## Adding Structured Data

```javascript
import StructuredData from '@/components/seo/StructuredData';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';

export default function YourPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://fivecloverhotels.com' },
    { name: 'Your Page', url: 'https://fivecloverhotels.com/your-page' }
  ]);

  return (
    <>
      <StructuredData data={breadcrumbs} />
      <div>Your content</div>
    </>
  );
}
```

## Dynamic Metadata (Blog Posts, etc.)

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

## Optimizing Images

```javascript
import Image from 'next/image';

<Image
  src="/images/hotel.jpg"
  alt="Descriptive alt text about the image"
  width={1200}
  height={800}
  priority={false}
  quality={85}
/>
```

## Testing Commands

```bash
# Build and test locally
npm run build
npm run start

# Run SEO validation
npm run seo-check

# Check sitemap
curl http://localhost:3000/sitemap.xml

# Check robots.txt
curl http://localhost:3000/robots.txt
```

## Testing URLs

- **Rich Results Test**: https://search.google.com/test/rich-results
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Validator**: https://cards-dev.twitter.com/validator
- **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly

## Common Schema Types

```javascript
// Organization
import { generateOrganizationSchema } from '@/lib/seo/structured-data';
const schema = generateOrganizationSchema();

// Hotel
import { generateHotelSchema } from '@/lib/seo/structured-data';
const schema = generateHotelSchema({
  name: 'Hotel Name',
  description: 'Description',
  address: 'Address',
  phone: '+234-XXX-XXX-XXXX',
  priceRange: '$$',
  rating: 4.5,
  image: '/hotel.jpg'
});

// Article
import { generateArticleSchema } from '@/lib/seo/structured-data';
const schema = generateArticleSchema({
  title: 'Article Title',
  brief: 'Description',
  coverImage: { url: '/image.jpg' },
  publishedAt: '2024-01-01T00:00:00Z'
});

// Breadcrumbs
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
const schema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://fivecloverhotels.com' },
  { name: 'Page', url: 'https://fivecloverhotels.com/page' }
]);
```

## Sitemap Priority Guidelines

- Homepage: `1.0`
- Main sections: `0.8`
- Blog posts: `0.6`
- Other pages: `0.5`

## Change Frequency Guidelines

- Homepage: `daily`
- Blog listing: `daily`
- Blog posts: `weekly`
- Static pages: `monthly`

## Image Requirements

- **Alt text**: Always required, descriptive
- **Open Graph**: 1200x630px, under 1MB
- **Format**: WebP preferred, JPG/PNG acceptable
- **File size**: Under 200KB when possible

## Pre-Deployment Checklist

- [ ] Unique titles and descriptions
- [ ] Canonical URLs set
- [ ] Open Graph images correct size
- [ ] All images have alt text
- [ ] Structured data validates
- [ ] Sitemap includes all pages
- [ ] Robots.txt configured
- [ ] Mobile viewport set
- [ ] No broken links
- [ ] Lighthouse SEO score 95+

## Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://fivecloverhotels.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-code
NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST=fivecloverhotels.hashnode.dev
```

---

For detailed documentation, see the [SEO Guide](SEO_GUIDE.md).
