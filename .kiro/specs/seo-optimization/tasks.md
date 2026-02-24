# Implementation Plan

- [x] 1. Create SEO utility library structure





  - Create `src/lib/seo/constants.js` with site configuration, hotel data, and SEO-related constants
  - Create `src/lib/seo/metadata.js` with reusable metadata generation utilities
  - Create `src/lib/seo/structured-data.js` with JSON-LD schema generator functions
  - _Requirements: 1.1, 2.1, 2.2_
-

- [x] 2. Create Hashnode API utility module








  - Extract blog fetching logic into `src/lib/hashnode.js` with `fetchHashnodeBlogs()` and `fetchBlogPost(slug)` functions
  - Implement proper error handling and fallbacks for API failures
  - Add caching strategy with revalidation
  - Write unit tests for API utility functions
  - _Requirements: 1.3, 3.2, 3.4_
-

- [x] 3. Implement structured data component






  - Create `src/components/seo/StructuredData.jsx` component that renders JSON-LD script tags
  - Write unit tests to validate JSON-LD output format
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Update root layout with comprehensive base metadata





  - Modify `src/app/layout.jsx` to export enhanced metadata object with metadataBase, title template, Open Graph, Twitter Card, and robots configuration
  - Add viewport and theme-color meta tags
  - Include Organization structured data using StructuredData component
  - _Requirements: 1.1, 1.4, 1.5, 2.1, 5.1, 8.1, 8.2_
-

- [x] 5. Add metadata to homepage




  - Export metadata object in `src/app/page.jsx` with homepage-specific title, description, and keywords
  - Add LocalBusiness structured data for all four hotels using StructuredData component
  - Add BreadcrumbList structured data
  - _Requirements: 1.1, 2.2, 2.4_


- [x] 6. Add metadata to blog listing page




  - Export metadata object in `src/app/blog/page.jsx` with blog-specific title and description
  - Update page to use Hashnode utility from `src/lib/hashnode.js`
  - Add BreadcrumbList structured data
  - _Requirements: 1.2, 2.4_
- [x] 7. Implement dynamic metadata for blog posts




- [ ] 7. Implement dynamic metadata for blog posts

  - Convert `src/app/blog/[slug]/page.jsx` to server component
  - Implement `generateMetadata` function that fetches blog post data and returns dynamic metadata with title, description, Open Graph, and Twitter Card tags
  - Add Article structured data using StructuredData component
  - Add BreadcrumbList structured data
  - Update page component to use Hashnode utility from `src/lib/hashnode.js`
  - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4, 5.2_
-

- [x] 8. Implement sitemap generation





  - Create `src/app/sitemap.js` that exports async function returning sitemap array
  - Include all static pages (homepage, blog listing) with appropriate lastModified, changeFrequency, and priority
  - Dynamically fetch and include all blog post URLs from Hashnode
  - Write integration tests to verify sitemap structure and content
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
- [x] 9. Implement robots.txt configuration








- [ ] 9. Implement robots.txt configuration

  - Create `src/app/robots.js` that exports function returning robots configuration
  - Configure rules to allow all user agents and include sitemap URL
  - Write integration tests to verify robots.txt format
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Add canonical URLs to all pages









  - Update metadata in root layout, homepage, blog listing, and blog post pages to include canonical URLs using alternates.canonical
  - Ensure blog post canonical points to Five Clover website, not Hashnode
  - _Requirements: 5.1, 5.2, 5.3_


- [x] 11. Optimize images for SEO




  - Audit all image components and add descriptive alt text
  - Update blog post images to use alt text based on blog title
  - Update hotel images with descriptive alt text
  - Ensure all metadata images use absolute URLs
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 12. Verify semantic HTML structure




  - Audit all components for proper heading hierarchy (h1, h2, h3)
  - Ensure navigation uses semantic nav elements
  - Ensure blog posts use article and section elements
  - Ensure footer uses semantic footer element
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 13. Add default Open Graph image




  - Create or add default Open Graph image to `public/og-image.jpg` (1200x630px)
  - Add hotel logo to `public/logo.png` for structured data
  - _Requirements: 1.4, 2.1_

- [x] 14. Configure Next.js for optimal SEO




  - Update `next.config.mjs` to ensure proper image optimization settings
  - Verify static page generation is enabled for homepage and blog listing
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 15. Add Google Analytics and Search Console verification




  - Add Google Analytics tracking code to root layout (use environment variable for tracking ID)
  - Add Google Search Console verification meta tag to root layout metadata
  - Implement with performance optimization (defer/async loading)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 16. Run SEO validation and testing



  - Test all pages with Google Rich Results Test to validate structured data
  - Test Open Graph tags with Facebook Sharing Debugger
  - Test Twitter Card tags with Twitter Card Validator
  - Run Lighthouse SEO audit and achieve score of 95+
  - Verify sitemap.xml is accessible and valid
  - Verify robots.txt is accessible and properly formatted
  - Test mobile-friendliness with Google Mobile-Friendly Test
  - _Requirements: All requirements validation_

- [x] 17. Create SEO documentation





  - Document SEO configuration in README or separate SEO.md file
  - Include instructions for updating metadata, adding new pages, and maintaining SEO
  - Document environment variables needed for analytics and verification
  - _Requirements: Supporting documentation for maintenance_
