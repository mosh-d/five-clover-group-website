import BlogSection from "@/components/blog/BlogSection";

async function fetchHashnodeBlogs() {
  const query = `
    query {
      publication(host: "fivecloverhotels.hashnode.dev") {
        title
        posts(first: 10) {
          totalDocuments
          edges {
            node {
              title
              brief
              slug
              publishedAt
              coverImage {
                url
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 }, // Re-fetch every 60 seconds — picks up republished posts automatically
    });

    if (!res.ok) {
      console.error("Hashnode fetch failed with status:", res.status);
      return [];
    }

    const json = await res.json();

    if (json.errors) {
      console.error("Hashnode GraphQL errors:", json.errors);
      return [];
    }

    if (!json.data?.publication?.posts?.edges) {
      console.error("No publication or posts found:", json);
      return [];
    }

    return json.data.publication.posts.edges.map(({ node }) => ({
      title: node.title,
      caption: node.brief,
      image: node.coverImage?.url ?? null,
      slug: node.slug,
      publishedAt: node.publishedAt,
    }));
  } catch (error) {
    console.error("Error fetching Hashnode blogs:", error);
    return [];
  }
}

export default async function BlogPage() {
  const blogs = await fetchHashnodeBlogs();

  return <BlogSection blogs={blogs} />;
}
