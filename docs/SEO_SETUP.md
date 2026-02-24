# SEO Setup Guide

This document provides instructions for configuring and maintaining SEO features for the Five Clover Hotels Group website.

## Environment Variables

The following environment variables are required for full SEO functionality:

### Google Analytics

1. Create a Google Analytics 4 (GA4) property at https://analytics.google.com/
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to your `.env.local` file:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Google Search Console

1. Verify your site ownership at https://search.google.com/search-console
2. Choose the "HTML tag" verification method
3. Copy the content value from the meta tag (the verification code)
4. Add to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code-here
```

## Setup Instructions

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Google Analytics and Search Console credentials in `.env.local`

3. Restart your development server to apply the changes

## Performance Optimization

The Google Analytics implementation uses Next.js Script component with `afterInteractive` strategy, which:
- Loads scripts after the page becomes interactive
- Doesn't block initial page rendering
- Optimizes Core Web Vitals scores

## Verification

### Google Analytics

1. Start your development server or deploy to production
2. Visit your website
3. Check Google Analytics Real-Time reports to see active users
4. Verify events are being tracked

### Google Search Console

1. Add the verification code to your `.env.local` or production environment variables
2. Deploy your site
3. Return to Google Search Console and click "Verify"
4. Once verified, you can submit your sitemap: `https://yourdomain.com/sitemap.xml`

## Metadata Configuration

All pages include comprehensive metadata:

- **Title tags**: Unique for each page with template
- **Meta descriptions**: Descriptive and keyword-rich
- **Open Graph tags**: For social media sharing
- **Twitter Card tags**: For Twitter sharing
- **Canonical URLs**: To prevent duplicate content issues
- **Structured data**: JSON-LD for rich snippets

## Sitemap

The sitemap is automatically generated at `/sitemap.xml` and includes:
- All static pages
- All blog posts from Hashnode (dynamically fetched)
- Proper lastModified, changeFrequency, and priority values

Submit your sitemap to Google Search Console after verification.

## Robots.txt

The robots.txt file is automatically generated at `/robots.txt` and:
- Allows all user agents to crawl the site
- Includes the sitemap URL
- Can be customized in `src/app/robots.js`

## Testing SEO

### Tools

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Test structured data implementation
   - Verify Organization and LocalBusiness schemas

2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Test Open Graph tags
   - Preview how links appear on Facebook

3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Test Twitter Card tags
   - Preview how links appear on Twitter

4. **Google Lighthouse**: Built into Chrome DevTools
   - Run SEO audit
   - Target score: 95+

5. **Google Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
   - Verify mobile optimization

### Manual Testing Checklist

- [ ] Homepage metadata displays correctly
- [ ] Blog listing metadata displays correctly
- [ ] Individual blog post metadata is dynamic and accurate
- [ ] Open Graph images display in social media previews
- [ ] Sitemap includes all pages (`/sitemap.xml`)
- [ ] Robots.txt is properly formatted (`/robots.txt`)
- [ ] Structured data validates in Google Rich Results Test
- [ ] Canonical URLs are correct on all pages
- [ ] Mobile viewport is configured
- [ ] All images have descriptive alt text
- [ ] Google Analytics tracking is working
- [ ] Google Search Console verification is successful

## Maintenance

### Adding New Pages

When adding new pages:

1. Export a `metadata` object with page-specific information
2. Include canonical URL in `alternates.canonical`
3. Add appropriate structured data using the `StructuredData` component
4. Update sitemap if it's a static page (in `src/app/sitemap.js`)

### Updating Metadata

Page metadata can be updated in:
- `src/app/layout.jsx` - Base metadata for all pages
- Individual page files - Page-specific metadata
- `src/lib/seo/constants.js` - Site-wide SEO constants

### Monitoring Performance

Regularly check:
- Google Analytics for traffic and user behavior
- Google Search Console for search performance and issues
- Lighthouse scores for performance and SEO
- Core Web Vitals in Search Console

## Privacy Considerations

The current implementation:
- Uses Google Analytics with standard configuration
- Loads scripts after page interaction for performance
- Does not implement cookie consent (add if required by your jurisdiction)

Consider implementing a cookie consent banner if required by GDPR or other privacy regulations.

## Troubleshooting

### Google Analytics Not Tracking

1. Verify `NEXT_PUBLIC_GA_ID` is set correctly
2. Check browser console for errors
3. Ensure ad blockers are disabled for testing
4. Check Network tab for gtag.js requests

### Search Console Verification Failed

1. Verify `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` matches the code from Search Console
2. Ensure the site is deployed and accessible
3. Check that the meta tag appears in the page source
4. Try the alternative verification methods if needed

### Sitemap Not Updating

1. Clear Next.js cache: `rm -rf .next`
2. Rebuild the site
3. Check that Hashnode API is accessible
4. Verify revalidation settings in `src/app/sitemap.js`

## Additional Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Analytics Setup](https://support.google.com/analytics/answer/9304153)
- [Google Search Console Help](https://support.google.com/webmasters/answer/9128668)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
