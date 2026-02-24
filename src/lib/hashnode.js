/**
 * Hashnode API utility module
 * Provides functions to fetch blog posts from Hashnode GraphQL API
 */

const HASHNODE_API_URL = "https://gql.hashnode.com";
const PUBLICATION_HOST = "fivecloverhotels.hashnode.dev";
const REVALIDATE_TIME = 3600; // 1 hour in seconds

/**
 * Fetches a list of blog posts from Hashnode
 * @param {number} first - Number of posts to fetch (default: 10)
 * @returns {Promise<Array>} Array of blog post objects
 */
export async function fetchHashnodeBlogs(first = 10) {
  const query = `
    query GetBlogs($host: String!, $first: Int!) {
      publication(host: $host) {
        title
        posts(first: $first) {
          totalDocuments
          edges {
            node {
              title
              brief
              slug
              publishedAt
              updatedAt
              coverImage {
                url
              }
              author {
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(HASHNODE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          host: PUBLICATION_HOST,
          first,
        },
      }),
      next: { revalidate: REVALIDATE_TIME },
    });

    if (!res.ok) {
      console.error("Hashnode API request failed with status:", res.status);
      return [];
    }

    const json = await res.json();

    if (json.errors) {
      console.error("Hashnode GraphQL errors:", json.errors);
      return [];
    }

    if (!json.data?.publication?.posts?.edges) {
      console.error("No publication or posts found in response");
      return [];
    }

    return json.data.publication.posts.edges.map(({ node }) => ({
      title: node.title,
      brief: node.brief,
      caption: node.brief, // Alias for backward compatibility
      slug: node.slug,
      publishedAt: node.publishedAt,
      updatedAt: node.updatedAt,
      coverImage: node.coverImage,
      image: node.coverImage?.url ?? null, // Alias for backward compatibility
      author: node.author,
    }));
  } catch (error) {
    console.error("Error fetching Hashnode blogs:", error);
    return [];
  }
}

/**
 * Fetches a single blog post by slug from Hashnode
 * @param {string} slug - The slug of the blog post
 * @returns {Promise<Object|null>} Blog post object or null if not found
 */
export async function fetchBlogPost(slug) {
  if (!slug) {
    console.error("fetchBlogPost: slug is required");
    return null;
  }

  const query = `
    query GetPost($slug: String!, $host: String!) {
      publication(host: $host) {
        post(slug: $slug) {
          title
          brief
          slug
          publishedAt
          updatedAt
          content {
            html
            markdown
          }
          coverImage {
            url
          }
          author {
            name
            profilePicture
          }
          tags {
            name
            slug
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(HASHNODE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          slug,
          host: PUBLICATION_HOST,
        },
      }),
      next: { revalidate: REVALIDATE_TIME },
    });

    if (!res.ok) {
      console.error("Hashnode API request failed with status:", res.status);
      return null;
    }

    const json = await res.json();

    if (json.errors) {
      console.error("Hashnode GraphQL errors:", json.errors);
      return null;
    }

    if (!json.data?.publication?.post) {
      console.warn(`Blog post with slug "${slug}" not found`);
      return null;
    }

    return json.data.publication.post;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}
