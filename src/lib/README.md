# Hashnode API Utility

This module provides utility functions to fetch blog posts from the Five Clover Hotels Hashnode publication.

## Functions

### `fetchHashnodeBlogs(first = 10)`

Fetches a list of blog posts from Hashnode.

**Parameters:**
- `first` (number, optional): Number of posts to fetch. Default is 10.

**Returns:**
- `Promise<Array>`: Array of blog post objects with the following structure:
  ```javascript
  {
    title: string,
    brief: string,
    caption: string, // Alias for brief (backward compatibility)
    slug: string,
    publishedAt: string,
    updatedAt: string,
    coverImage: { url: string } | null,
    image: string | null, // Alias for coverImage.url (backward compatibility)
    author: { name: string }
  }
  ```

**Example:**
```javascript
import { fetchHashnodeBlogs } from '@/lib/hashnode';

const blogs = await fetchHashnodeBlogs(20); // Fetch 20 posts
```

### `fetchBlogPost(slug)`

Fetches a single blog post by its slug.

**Parameters:**
- `slug` (string, required): The slug of the blog post to fetch.

**Returns:**
- `Promise<Object|null>`: Blog post object or null if not found:
  ```javascript
  {
    title: string,
    brief: string,
    slug: string,
    publishedAt: string,
    updatedAt: string,
    content: {
      html: string,
      markdown: string
    },
    coverImage: { url: string } | null,
    author: {
      name: string,
      profilePicture: string
    },
    tags: Array<{ name: string, slug: string }>
  }
  ```

**Example:**
```javascript
import { fetchBlogPost } from '@/lib/hashnode';

const blog = await fetchBlogPost('my-blog-post-slug');
if (blog) {
  console.log(blog.title);
}
```

## Error Handling

Both functions implement comprehensive error handling:
- Returns empty array (`[]`) or `null` on API failures
- Logs errors to console for debugging
- Handles network errors gracefully
- Validates GraphQL responses

## Caching

Both functions use Next.js ISR (Incremental Static Regeneration) with a revalidation time of 3600 seconds (1 hour). This means:
- Data is cached for 1 hour
- After 1 hour, the next request will trigger a background revalidation
- Users always get fast responses from the cache

## Configuration

The module uses the following constants:
- `HASHNODE_API_URL`: "https://gql.hashnode.com"
- `PUBLICATION_HOST`: "fivecloverhotels.hashnode.dev"
- `REVALIDATE_TIME`: 3600 seconds (1 hour)

To modify these values, edit `src/lib/hashnode.js`.

## Testing

Unit tests are available in `src/lib/__tests__/hashnode.test.js`.

Run tests with:
```bash
npm test
```
