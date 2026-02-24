# SEO Testing Guide

This document provides instructions for validating the SEO implementation of the Five Clover Hotels website using both automated tests and external validation tools.

## Automated Tests

Run all SEO tests with:

```bash
npm test
```

Run specific SEO test suites:

```bash
# Run all SEO tests
npm test src/__tests__/seo

# Run specific test files
npm test src/__tests__/seo/structured-data.test.js
npm test src/__tests__/seo/page-metadata.test.js
npm test src/__tests__/seo/robots.test.js
npm test src/__tests__/seo/semantic-html.test.js
npm test src/__tests__/seo/image-optimization.test.js
npm test src/__tests__/seo/seo-validation.test.js
```

## Manual Testing with External Tools

### 1. Google Rich Results Test

**Purpose:** Validate structured data (JSON-LD schemas)

**Steps:**
1. Build and deploy the website or run locally
2. Visit: https://search.google.com/test/rich-results
3. Enter your page URL or paste the HTML
4. Test the following pages:
   - Homepage (should show Organization and Hotel schemas)
   - Blog listing page (should show BreadcrumbList)
   - Individual blog post (should show Article schema)

**Expected Results:**
- ✅ No errors in structured data
- ✅ Organization schema detected
- ✅ Hotel schemas detected (4 hotels)
- ✅ Article schema detected on blog posts
- ✅ BreadcrumbList schema detected

### 2. Facebook Sharing Debugger

**Purpose:** Test Open Graph tags for social media sharing

**Steps:**
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your page URL
3. Click "Debug"
4. Test the following pages:
   - Homepage
   - Blog listing page
   - Individual blog post

**Expected Results:**
- ✅ og:title displays correctly
- ✅ og:description displays correctly
- ✅ og:image shows the correct image (1200x630px)
- ✅ og:url is correct
- ✅ og:type is set appropriately
- ✅ No warnings or errors

### 3. Twitter Card Validator

**Purpose:** Test Twitter Card metadata

**Steps:**
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your page URL
3. Click "Preview card"
4. Test the following pages:
   - Homepage
   - Blog listing page
   - Individual blog post

**Expected Results:**
- ✅ Card type: summary_large_image
- ✅ Title displays correctly
- ✅ Description displays correctly
- ✅ Image displays correctly
- ✅ No errors

### 4. Google Lighthouse SEO Audit

**Purpose:** Comprehensive SEO audit

**Steps:**
1. Open your website in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Select "SEO" category
5. Click "Analyze page load"
6. Test the following pages:
   - Homepage
   - Blog listing page
   - Individual blog post
   - Contact page

**Expected Results:**
- ✅ SEO score: 95+ (target: 100)
- ✅ Document has a `<title>` element
- ✅ Document has a meta description
- ✅ Page has successful HTTP status code
- ✅ Links have descriptive text
- ✅ Document uses legible font sizes
- ✅ Tap targets are sized appropriately
- ✅ Page is mobile friendly
- ✅ Structured data is valid

**Common Issues to Check:**
- Missing alt text on images
- Missing meta description
- Blocked resources
- Invalid structured data
- Missing canonical URL

### 5. Sitemap Validation

**Purpose:** Verify sitemap.xml is accessible and valid

**Steps:**
1. Visit: https://yourdomain.com/sitemap.xml
2. Verify the XML structure
3. Use XML Sitemap Validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html
4. Submit sitemap to Google Search Console

**Expected Results:**
- ✅ Sitemap is accessible at /sitemap.xml
- ✅ Valid XML format
- ✅ Contains all static pages (homepage, about, contact, blog)
- ✅ Contains all blog post URLs
- ✅ Each URL has lastModified, changeFrequency, and priority
- ✅ All URLs use HTTPS
- ✅ No 404 errors for listed URLs

### 6. Robots.txt Validation

**Purpose:** Verify robots.txt is properly configured

**Steps:**
1. Visit: https://yourdomain.com/robots.txt
2. Verify the content
3. Use Google Search Console Robots Testing Tool

**Expected Results:**
- ✅ Robots.txt is accessible at /robots.txt
- ✅ User-agent: * is present
- ✅ Allow: / is present
- ✅ Disallow: /api/ is present
- ✅ Sitemap URL is included
- ✅ Proper formatting

**Example Expected Content:**
```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://fivecloverhotels.com/sitemap.xml
```

### 7. Google Mobile-Friendly Test

**Purpose:** Verify mobile optimization

**Steps:**
1. Visit: https://search.google.com/test/mobile-friendly
2. Enter your page URL
3. Click "Test URL"
4. Test all major pages

**Expected Results:**
- ✅ Page is mobile friendly
- ✅ Text is readable without zooming
- ✅ Tap targets are appropriately sized
- ✅ Content fits the screen
- ✅ No horizontal scrolling required

### 8. PageSpeed Insights

**Purpose:** Test performance and SEO together

**Steps:**
1. Visit: https://pagespeed.web.dev/
2. Enter your page URL
3. Analyze both mobile and desktop
4. Test all major pages

**Expected Results:**
- ✅ Performance score: 90+
- ✅ SEO score: 95+
- ✅ Best Practices score: 90+
- ✅ Accessibility score: 90+

## Google Search Console Setup

After deployment, set up Google Search Console:

1. **Add Property:**
   - Go to https://search.google.com/search-console
   - Add your domain
   - Verify ownership using the meta tag (already in layout.jsx)

2. **Submit Sitemap:**
   - In Search Console, go to Sitemaps
   - Submit: https://fivecloverhotels.com/sitemap.xml

3. **Monitor:**
   - Check for crawl errors
   - Monitor search performance
   - Review coverage reports
   - Check mobile usability

## Checklist for Production Deployment

Before deploying to production, verify:

- [ ] All automated tests pass (`npm test`)
- [ ] Google Rich Results Test shows no errors
- [ ] Facebook Sharing Debugger shows correct preview
- [ ] Twitter Card Validator shows correct preview
- [ ] Lighthouse SEO score is 95+
- [ ] Sitemap.xml is accessible and valid
- [ ] Robots.txt is accessible and properly formatted
- [ ] Mobile-Friendly Test passes
- [ ] All images have descriptive alt text
- [ ] All pages have unique titles and descriptions
- [ ] Canonical URLs are set correctly
- [ ] Structured data validates without errors
- [ ] Google Analytics is configured (if using)
- [ ] Google Search Console verification is set up

## Environment Variables

Ensure these environment variables are set in production:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id (optional)
```

## Continuous Monitoring

After deployment, regularly check:

1. **Weekly:**
   - Google Search Console for errors
   - Search rankings for target keywords
   - Sitemap coverage

2. **Monthly:**
   - Run Lighthouse audits
   - Check for broken links
   - Review structured data

3. **Quarterly:**
   - Full SEO audit
   - Competitor analysis
   - Update keywords and content

## Troubleshooting

### Structured Data Not Showing

- Clear cache and retest
- Verify JSON-LD is in page source
- Check for JavaScript errors
- Use Google Rich Results Test

### Sitemap Not Updating

- Check revalidation settings
- Rebuild the site
- Clear CDN cache
- Verify Hashnode API is working

### Low Lighthouse Score

- Check for render-blocking resources
- Optimize images
- Review third-party scripts
- Check mobile viewport settings

### Social Media Preview Not Working

- Verify Open Graph tags in page source
- Use absolute URLs for images
- Clear social media cache (Facebook Debugger)
- Check image dimensions (1200x630px)

## Additional Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Next.js Metadata Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
