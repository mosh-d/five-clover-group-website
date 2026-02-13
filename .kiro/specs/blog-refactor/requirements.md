# Requirements Document

## Introduction

This feature involves refactoring the blog page and blog-related components from a styled-components implementation to match the existing codebase patterns using Tailwind CSS. The current blog components (BlogPost, Ad, BlogSection, FullBlogPage) use styled-components and a custom Text component from a different codebase. The goal is to modernize these components to align with the Five Clover Hotels website's design system, which uses Tailwind CSS, Next.js 16, and the established component patterns found in the home and shared components.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the blog components to use Tailwind CSS instead of styled-components, so that the codebase maintains consistency and follows the established design patterns.

#### Acceptance Criteria

1. WHEN reviewing the blog components THEN they SHALL use Tailwind CSS classes instead of styled-components
2. WHEN examining the component structure THEN they SHALL NOT import or use styled-components library
3. WHEN comparing with existing components THEN the blog components SHALL follow the same styling patterns as Hero.jsx and MiniAbout.jsx
4. WHEN checking dependencies THEN styled-components SHALL be removed from any blog-related imports

### Requirement 2

**User Story:** As a developer, I want the blog components to use the existing Button component, so that UI elements are consistent across the application.

#### Acceptance Criteria

1. WHEN a button is needed in blog components THEN it SHALL use the shared Button component from src/components/shared/Button.jsx
2. WHEN examining BlogPost component THEN custom StyledButton SHALL be replaced with the shared Button component
3. WHEN examining Ad component THEN custom button implementations SHALL use the shared Button component
4. IF additional button variants are needed THEN they SHALL use the existing UnderlinedButton component or extend the Button component

### Requirement 3

**User Story:** As a developer, I want the blog components to use standard HTML elements with Tailwind classes instead of the custom Text component, so that the codebase doesn't depend on external component libraries.

#### Acceptance Criteria

1. WHEN text needs to be displayed THEN standard HTML elements (h1, h2, p, span) SHALL be used with Tailwind classes
2. WHEN examining refactored components THEN the custom Text component SHALL NOT be imported or used
3. WHEN styling text THEN the FONTS utility from src/utils/fonts.js SHALL be used for consistent typography
4. WHEN comparing with existing components THEN text styling SHALL match the patterns in Hero.jsx and MiniAbout.jsx

### Requirement 4

**User Story:** As a developer, I want the blog components to use Next.js Link and routing instead of react-router-dom, so that navigation is consistent with the Next.js framework.

#### Acceptance Criteria

1. WHEN navigation is needed THEN Next.js Link component SHALL be used instead of react-router-dom RouterLink
2. WHEN examining imports THEN react-router-dom SHALL NOT be imported in any blog components
3. WHEN implementing the full blog page THEN Next.js dynamic routing patterns SHALL be used instead of useParams from react-router
4. WHEN checking the blog page structure THEN it SHALL follow Next.js App Router conventions

### Requirement 5

**User Story:** As a developer, I want the BlogPost component to display blog content with proper responsive design, so that users have a good experience on all devices.

#### Acceptance Criteria

1. WHEN viewing the BlogPost component THEN it SHALL display a cover image, title, and content excerpt
2. WHEN the user clicks "Read more" THEN the content SHALL expand to show the full excerpt
3. WHEN the user clicks "Read less" THEN the content SHALL collapse back to the truncated view
4. WHEN the user clicks "View Full Blog" THEN they SHALL be navigated to the full blog post page
5. WHEN viewing on different screen sizes THEN the component SHALL be responsive using Tailwind responsive classes

### Requirement 6

**User Story:** As a developer, I want the BlogSection component to fetch and display blog posts from Hashnode, so that the blog content is dynamically loaded.

#### Acceptance Criteria

1. WHEN the BlogSection component mounts THEN it SHALL fetch blog posts from the Hashnode GraphQL API
2. WHEN blog posts are loading THEN a loading state SHALL be displayed
3. WHEN no blogs are found THEN an appropriate message SHALL be displayed
4. WHEN blogs are successfully fetched THEN the main blog post SHALL be displayed prominently
5. WHEN multiple blogs exist THEN a horizontal scrollable list of mini blog posts SHALL be displayed
6. WHEN a mini blog post is clicked THEN it SHALL become the active main blog post

### Requirement 7

**User Story:** As a developer, I want to create a MiniBlogPost component, so that users can preview and select different blog posts.

#### Acceptance Criteria

1. WHEN the MiniBlogPost component is rendered THEN it SHALL display a thumbnail image and title
2. WHEN a user clicks on a MiniBlogPost THEN it SHALL trigger a callback to update the active blog
3. WHEN styling the component THEN it SHALL use Tailwind CSS classes
4. WHEN multiple MiniBlogPost components are displayed THEN they SHALL be arranged in a horizontal scrollable container

### Requirement 8

**User Story:** As a developer, I want the FullBlogPage to display complete blog content, so that users can read the entire article.

#### Acceptance Criteria

1. WHEN the FullBlogPage loads THEN it SHALL fetch the full blog post content from Hashnode using the slug
2. WHEN the blog is loading THEN a loading state SHALL be displayed
3. WHEN the blog is not found THEN an appropriate error message SHALL be displayed
4. WHEN the blog is successfully loaded THEN it SHALL display the title, cover image, and full HTML content
5. WHEN the user wants to go back THEN a back button SHALL be provided using Next.js navigation
6. WHEN styling the page THEN it SHALL use Tailwind CSS and match the site's design system

### Requirement 9

**User Story:** As a developer, I want the Ad component to be refactored with Tailwind CSS, so that it matches the codebase styling patterns.

#### Acceptance Criteria

1. WHEN the Ad component is rendered THEN it SHALL use Tailwind CSS classes instead of styled-components
2. WHEN displaying content THEN it SHALL use standard HTML elements with Tailwind classes
3. WHEN the component includes scrollable content THEN it SHALL use Tailwind's scrollbar utilities
4. WHEN examining the component THEN it SHALL follow the same structural patterns as other components in the codebase

### Requirement 10

**User Story:** As a developer, I want the blog page structure to follow Next.js App Router conventions, so that routing and navigation work correctly.

#### Acceptance Criteria

1. WHEN examining the blog page structure THEN it SHALL use the App Router file structure (app/blog/page.jsx)
2. WHEN a dynamic blog post route is needed THEN it SHALL be created at app/blog/[slug]/page.jsx
3. WHEN implementing dynamic routes THEN Next.js params SHALL be used instead of react-router useParams
4. WHEN navigating between pages THEN Next.js navigation patterns SHALL be used
