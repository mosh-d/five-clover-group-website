# Canonical URLs Implementation

## Overview

Canonical URLs have been implemented across all pages of the Five Clover Hotels Group website to prevent duplicate content issues and ensure search engines index the correct version of each page.

## Implementation Details

### Pages with Canonical URLs

1. **Root Layout** (`src/app/layout.jsx`)
   - Canonical: `https://fivecloverhotels.com`
   - Applied to all pages as base metadata

2. **Homepage** (`src/app/page.jsx`)
   - Canonical: `https://fivecloverhotels.com/`

3. **Blog Listing** (`src/app/blog/page.jsx`)
   - Canonical: `https://fivecloverhotels.com/blog`

4. **Blog Posts** (`src/app/blog/[slug]/page.jsx`)
   - Canonical: `https://fivecloverhotels.com/blog/{slug}`
   - **Important**: Points to Five Clover website, NOT Hashnode source

5. **About Page** (`src/app/about/page.jsx`)
   - Canonical: `https://fivecloverhotels.com/about`

6. **Contact Page** (`src/app/contact/page.jsx`)
   - Canonical: `https://fivecloverhotels.com/contact`

## Technical Implementation

### Using Next.js Metadata API

All canonical URLs are implemented using Next.js 16's Metadata API with the `alternates.canonical` property:

```javascript
export const metadata = {
  alternates: {
    canonical: 'https://fivecloverhotels.com/path',
  },
  // ... other metadata
};
```

### Helper Functions

Two helper functions in `src/lib/seo/metadata.js` generate metadata with canonical URLs:

1. **`generatePageMetadata()`** - For static pages
2. **`generateArticleMetadata()`** - For blog posts

Both functions automatically include canonical URLs pointing to the Five Clover domain.

## Requirements Satisfied

✅ **Requirement 5.1**: All pages include canonical URLs using `alternates.canonical`

✅ **Requirement 5.2**: Blog post canonical URLs point to Five Clover website (`https://fivecloverhotels.com/blog/{slug}`), not Hashnode

✅ **Requirement 5.3**: Canonical URLs consistently point to the primary version of each page

## Testing

Comprehensive tests verify canonical URL implementation:

- `src/__tests__/seo/canonical-urls.test.js` - Tests metadata generation functions
- `src/__tests__/seo/all-pages-canonical.test.js` - Tests all pages have correct canonical URLs

All tests pass successfully.

## Verification

To verify canonical URLs in production:

1. View page source and look for:
   ```html
   <link rel="canonical" href="https://fivecloverhotels.com/path" />
   ```

2. Use SEO tools:
   - Google Search Console
   - Screaming Frog SEO Spider
   - Ahrefs Site Audit

3. Check specific pages:
   - Homepage: Should have canonical to root domain
   - Blog posts: Should point to Five Clover domain, not Hashnode
   - All pages: Should use HTTPS protocol

## Benefits

1. **Prevents Duplicate Content**: Search engines know which version to index
2. **Consolidates Link Equity**: All backlinks count toward the canonical URL
3. **Improves SEO**: Clear signals to search engines about preferred URLs
4. **Blog Post Ownership**: Blog posts canonical to Five Clover, not Hashnode source
