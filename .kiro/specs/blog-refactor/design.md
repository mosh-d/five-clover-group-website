# Design Document

## Overview

This design document outlines the refactoring of the blog page and related components from a styled-components implementation to a Tailwind CSS-based implementation that aligns with the Five Clover Hotels website design system. The refactoring will maintain all existing functionality while modernizing the codebase to use Next.js 16 App Router conventions, Tailwind CSS for styling, and the established component patterns.

The refactoring affects the following components:
- `BlogPost.jsx` - Individual blog post display with expand/collapse functionality
- `BlogSection.jsx` - Main blog section with Hashnode API integration
- `FullBlogPage.jsx` - Full blog post view
- `Ad.jsx` - Advertisement/promotional sidebar component
- `MiniBlogPost.jsx` - New component for blog post thumbnails (currently missing)

## Architecture

### Component Hierarchy

```
app/blog/page.jsx
└── BlogSection (client component)
    ├── BlogPost (client component)
    │   └── Button (shared)
    ├── MiniBlogPost[] (client component)
    └── Ad (optional, currently commented out)

app/blog/[slug]/page.jsx
└── FullBlogPage (client component)
    └── Button (for back navigation)
```

### Data Flow

1. **BlogSection** fetches blog posts from Hashnode GraphQL API on mount
2. **BlogSection** manages active blog state and passes data to child components
3. **BlogPost** receives blog data as props and manages its own expand/collapse state
4. **MiniBlogPost** components receive blog data and callback to update active blog
5. **FullBlogPage** fetches individual blog post content using slug from URL params

### Routing Structure

```
/blog                    → app/blog/page.jsx
/blog/[slug]            → app/blog/[slug]/page.jsx (to be created)
```

## Components and Interfaces

### 1. BlogPost Component

**Location:** `src/components/shared/BlogPost.jsx`

**Purpose:** Display individual blog post with image, title, excerpt, and actions

**Props Interface:**
```javascript
{
  image: string,        // URL to cover image
  title: string,        // Blog post title
  content: string,      // Blog post excerpt/brief
  slug: string         // URL slug for full blog post
}
```

**State:**
- `textOpen: boolean` - Controls expand/collapse of content

**Key Features:**
- Cover image with background-cover styling
- Title using heading typography from FONTS utility
- Expandable/collapsible content with line-clamp
- "Read more/less" button
- "View Full Blog" button with navigation to `/blog/[slug]`

**Styling Approach:**
- Use Tailwind classes for layout (flex, gap, padding)
- Use CSS custom properties for colors (var(--text-color), var(--white), etc.)
- Use FONTS utility for typography consistency
- Implement line-clamp with Tailwind's `line-clamp-2` utility
- Responsive design with Tailwind breakpoints

### 2. BlogSection Component

**Location:** `src/components/blog/BlogSection.jsx`

**Purpose:** Main container for blog listing with Hashnode API integration

**State:**
- `activeBlog: number` - Index of currently displayed blog
- `blogs: array` - Array of blog post objects
- `loading: boolean` - Loading state for API fetch

**Key Features:**
- Fetches blogs from Hashnode GraphQL API
- Displays loading and empty states
- Shows active blog in main area
- Horizontal scrollable list of mini blog posts
- Optional Ad component (currently commented out)

**API Integration:**
```javascript
// Hashnode GraphQL Query
query {
  publication(host: "cordiis.hashnode.dev") {
    posts(first: 10) {
      edges {
        node {
          title
          brief
          slug
          coverImage {
            url
          }
        }
      }
    }
  }
}
```

**Styling Approach:**
- Full-width container with padding
- Background color using var(--background-color)
- Flex layout for main blog and sidebar
- Custom scrollbar styling for mini blog list
- Responsive layout that stacks on mobile

### 3. MiniBlogPost Component

**Location:** `src/components/shared/MiniBlogPost.jsx` (to be created)

**Purpose:** Thumbnail preview of blog post for selection

**Props Interface:**
```javascript
{
  image: string,        // URL to cover image
  title: string,        // Blog post title
  caption: string,      // Blog post brief
  onSelect: function,   // Callback when clicked
  href: string         // Anchor link to scroll to main blog
}
```

**Key Features:**
- Compact card layout with image and title
- Click handler to update active blog
- Hover effects for interactivity
- Consistent sizing for horizontal scroll

**Styling Approach:**
- Fixed width for consistent sizing in scroll container
- Aspect ratio for image consistency
- Hover scale effect with Tailwind transitions
- Truncated title with line-clamp

### 4. FullBlogPage Component

**Location:** `src/app/blog/[slug]/page.jsx` (to be created)

**Purpose:** Display complete blog post content

**Props:**
- Receives `params.slug` from Next.js dynamic route

**State:**
- `blog: object` - Full blog post data
- `loading: boolean` - Loading state

**Key Features:**
- Fetches full blog content from Hashnode API
- Displays title, cover image, and full HTML content
- Back button for navigation
- Loading and error states

**API Integration:**
```javascript
// Hashnode GraphQL Query for single post
query GetPost($slug: String!, $host: String!) {
  publication(host: $host) {
    post(slug: $slug) {
      title
      content {
        html
      }
      coverImage {
        url
      }
    }
  }
}
```

**Styling Approach:**
- Container with max-width for readability
- Padding for comfortable reading experience
- Typography styles for blog content
- Responsive image sizing

### 5. Ad Component

**Location:** `src/components/shared/Ad.jsx`

**Purpose:** Display promotional content and additional information

**Key Features:**
- Main ad section with image and CTA
- Scrollable text content section
- Custom scrollbar styling
- Gradient overlay effect

**Styling Approach:**
- Flex column layout
- Background images with Tailwind
- Custom scrollbar using Tailwind scrollbar plugin or custom CSS
- Gradient overlay using Tailwind gradient utilities

## Data Models

### Blog Post Object
```javascript
{
  title: string,
  caption: string,      // Brief/excerpt
  image: string,        // Cover image URL
  slug: string         // URL slug
}
```

### Full Blog Post Object
```javascript
{
  title: string,
  content: {
    html: string       // Full HTML content
  },
  coverImage: {
    url: string
  }
}
```

## Error Handling

### API Errors
- Wrap fetch calls in try-catch blocks
- Log errors to console for debugging
- Display user-friendly error messages
- Provide fallback UI for failed requests

### Loading States
- Show loading indicators during API calls
- Prevent interaction during loading
- Timeout handling for slow connections

### Not Found States
- Handle missing blog posts gracefully
- Display "Blog not found" message
- Provide navigation back to blog list

## Testing Strategy

### Component Testing
1. **BlogPost Component**
   - Test expand/collapse functionality
   - Test navigation to full blog page
   - Test responsive layout
   - Test with different content lengths

2. **BlogSection Component**
   - Test API integration with mock data
   - Test loading states
   - Test empty states
   - Test active blog selection
   - Test horizontal scroll behavior

3. **MiniBlogPost Component**
   - Test click handler
   - Test hover effects
   - Test image loading
   - Test title truncation

4. **FullBlogPage Component**
   - Test dynamic route parameter handling
   - Test API integration
   - Test back navigation
   - Test HTML content rendering
   - Test error states

5. **Ad Component**
   - Test scrollable content
   - Test responsive layout
   - Test image loading

### Integration Testing
- Test navigation flow from blog list to full post
- Test back navigation from full post to list
- Test active blog persistence during mini blog selection
- Test responsive behavior across breakpoints

### Manual Testing Checklist
- [ ] Verify all styled-components removed
- [ ] Verify Tailwind classes applied correctly
- [ ] Verify responsive design on mobile, tablet, desktop
- [ ] Verify API integration with Hashnode
- [ ] Verify navigation between pages
- [ ] Verify button components match existing patterns
- [ ] Verify typography matches design system
- [ ] Verify color scheme matches CSS custom properties
- [ ] Verify scrollbar styling
- [ ] Verify hover and active states

## Design Decisions and Rationales

### 1. Client Components vs Server Components
**Decision:** Use client components for blog components
**Rationale:** Blog components require state management (expand/collapse, active blog selection) and API calls with useEffect, which necessitate client-side rendering.

### 2. Tailwind CSS over Styled Components
**Decision:** Replace all styled-components with Tailwind CSS
**Rationale:** Maintains consistency with existing codebase, reduces bundle size, improves performance, and follows modern React/Next.js best practices.

### 3. Next.js Link over React Router
**Decision:** Use Next.js Link and navigation
**Rationale:** Next.js App Router provides built-in routing, prefetching, and better performance. React Router is unnecessary in a Next.js application.

### 4. Dynamic Routes for Blog Posts
**Decision:** Create `/blog/[slug]` dynamic route
**Rationale:** Follows Next.js conventions, enables SEO-friendly URLs, and allows for future static generation of blog posts.

### 5. FONTS Utility for Typography
**Decision:** Use existing FONTS utility from `src/utils/fonts.js`
**Rationale:** Maintains typography consistency across the application and provides a single source of truth for text styling.

### 6. CSS Custom Properties for Colors
**Decision:** Use var(--color-name) for all colors
**Rationale:** Maintains consistency with existing design system and allows for easy theme changes.

### 7. Hashnode API Integration
**Decision:** Keep existing Hashnode GraphQL API integration
**Rationale:** Hashnode provides a reliable CMS for blog content, and the existing integration works well.

### 8. Line Clamp for Content Truncation
**Decision:** Use Tailwind's line-clamp utility
**Rationale:** Simpler than custom CSS, better browser support, and more maintainable.

### 9. Horizontal Scroll for Mini Blogs
**Decision:** Maintain horizontal scrollable container
**Rationale:** Provides good UX for browsing multiple blog posts without taking up vertical space.

### 10. Component File Organization
**Decision:** Keep BlogPost and MiniBlogPost in shared/, BlogSection in blog/
**Rationale:** Shared components can be reused elsewhere, while BlogSection is specific to the blog page.

## Migration Path

### Phase 1: Component Refactoring
1. Refactor BlogPost component
2. Create MiniBlogPost component
3. Refactor BlogSection component
4. Refactor Ad component

### Phase 2: Routing Setup
1. Create dynamic route at `app/blog/[slug]/page.jsx`
2. Refactor FullBlogPage component
3. Update navigation links

### Phase 3: Testing and Cleanup
1. Test all components
2. Remove unused imports
3. Verify responsive design
4. Clean up commented code

## Responsive Design Breakpoints

Following the existing codebase patterns:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Tailwind breakpoints:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

## Accessibility Considerations

- Semantic HTML elements (h1, h2, p, button, nav)
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Focus states for interactive elements
- ARIA labels where appropriate
- Sufficient color contrast
- Responsive text sizing

## Performance Considerations

- Lazy load images with Next.js Image component where appropriate
- Optimize API calls (consider caching)
- Minimize re-renders with proper state management
- Use CSS transforms for animations (better performance)
- Implement loading states to improve perceived performance
- Consider pagination for large blog lists
