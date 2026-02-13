# Implementation Plan

- [x] 1. Refactor MiniBlogPost component to use Tailwind CSS


  - Remove all styled-components imports and styled component definitions
  - Replace StyledMiniBlogPost with div using Tailwind flex classes
  - Replace StyledImageContainer with div using Tailwind background utilities and overflow
  - Replace StyledTextWrapper with div using Tailwind padding and gap classes
  - Replace StyledContentText with div using Tailwind line-clamp-2 utility
  - Replace StyledTitleText with div using Tailwind line-clamp-1 utility
  - Replace custom Text component with standard HTML elements (h2, p)
  - Apply FONTS utility classes for typography
  - Implement hover effects using Tailwind hover: classes
  - Add image zoom effect on hover using Tailwind scale and transition
  - Remove unused 'e' parameter from handleClick function
  - Add responsive classes for mobile/tablet/desktop layouts
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3, 7.4_



- [ ] 2. Refactor BlogPost component to use Tailwind CSS
  - Remove all styled-components imports and styled component definitions
  - Replace StyledBlog with div using Tailwind flex classes
  - Replace StyledImageContainer with div using Tailwind background utilities
  - Replace StyledTextWrapper with div using Tailwind padding and gap classes
  - Replace StyledParagraphContainer with div using Tailwind line-clamp utility
  - Implement conditional line-clamp based on textOpen state
  - Replace custom Text component with standard HTML elements (h1, p)
  - Apply FONTS utility classes for typography
  - Replace StyledButton with shared Button component
  - Update "View Full Blog" button to use Next.js Link
  - Remove react-router-dom imports (RouterLink, useLocation)


  - Add responsive classes for mobile/tablet/desktop layouts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Refactor BlogSection component to use Tailwind CSS and Next.js
  - Remove all styled-components imports and styled component definitions
  - Replace StyledBlogSection with div using Tailwind classes
  - Replace StyledBlogContainer with div using Tailwind classes
  - Replace StyledMainBlogContainer with div wrapper
  - Replace StyledMiniBlogWrapper with div using Tailwind flex and overflow classes
  - Implement custom scrollbar styling using Tailwind or custom CSS
  - Replace StyledAdContainer with div using Tailwind classes
  - Remove react-router-dom imports


  - Update MiniBlogPost import to use new component
  - Add "use client" directive at top of file
  - Ensure responsive layout with Tailwind breakpoints
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 4. Refactor Ad component to use Tailwind CSS
  - Remove all styled-components imports and styled component definitions
  - Replace StyledAd with div using Tailwind flex classes
  - Replace StyledMainAd with div using Tailwind classes
  - Replace StyledMainAdImage with div using Tailwind background utilities
  - Replace StyledMainAdText with div using Tailwind classes
  - Replace StyledAdText with div using Tailwind classes and gradient overlay
  - Replace StyledParagraphContainer with div using Tailwind scrollbar utilities


  - Replace StyledUl with ul using Tailwind classes
  - Replace custom Text component with standard HTML elements
  - Apply FONTS utility classes for typography
  - Replace Button usage with shared Button component
  - Remove unused cloudinaryBg import

  - _Requirements: 1.1, 1.2, 1.3, 2.3, 3.1, 3.2, 3.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 5. Create dynamic blog post route
  - Create new directory at `src/app/blog/[slug]`
  - Create `page.jsx` file in the new directory
  - Set up async function to receive params from Next.js
  - Extract slug from params
  - _Requirements: 4.3, 10.1, 10.2, 10.3_

- [ ] 6. Refactor FullBlogPage component for Next.js App Router
  - Move FullBlogPage logic into `src/app/blog/[slug]/page.jsx`
  - Add "use client" directive at top of file
  - Remove react-router-dom imports (useParams, RouterLink)
  - Update to receive params as prop from Next.js
  - Extract slug from params.slug


  - Replace RouterLink back button with Next.js Link or useRouter
  - Remove custom Text component usage
  - Use standard HTML elements with Tailwind classes
  - Apply FONTS utility for typography



  - Update Hashnode API query to use correct host
  - Add proper error handling and loading states
  - Style container with Tailwind classes for max-width and padding
  - Add responsive styling
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.2, 10.3, 10.4_




- [ ] 7. Update blog page to use refactored components
  - Verify `src/app/blog/page.jsx` imports BlogSection correctly
  - Ensure BlogSection is rendered properly
  - Test that all components work together
  - _Requirements: 10.1_

- [ ] 8. Clean up and remove unused dependencies
  - Search for any remaining styled-components imports in blog-related files
  - Search for any remaining react-router-dom imports in blog-related files
  - Remove unused imports (cloudinaryBg, useLocation, etc.)
  - Verify no custom Text component imports remain
  - Fix any linting issues
  - _Requirements: 1.2, 1.4, 4.2_

- [ ] 9. Test responsive design and functionality
  - Test BlogPost expand/collapse functionality
  - Test MiniBlogPost selection and active blog switching
  - Test navigation from blog list to full blog post
  - Test back navigation from full blog post
  - Test responsive layout on mobile, tablet, and desktop viewports
  - Test horizontal scroll behavior for mini blog posts
  - Test loading states for API calls
  - Test error states for failed API calls
  - Verify all buttons use shared Button component
  - Verify typography matches FONTS utility
  - Verify colors use CSS custom properties
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_
