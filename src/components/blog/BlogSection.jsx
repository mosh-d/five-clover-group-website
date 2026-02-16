"use client";

import { useState, useEffect } from "react";
import BlogPost from "../shared/BlogPost";
import MiniBlogPost from "../shared/MiniBlogPost";

export default function BlogSection() {
  const [activeBlog, setActiveBlog] = useState(0);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHashnodeBlogs() {
      const query = `query { publication(host: "fivecloverhotels.hashnode.dev") { title posts(first: 10) { totalDocuments edges { node { title brief slug publishedAt coverImage { url } } } } } }`;

      console.log("Sending query:", query);

      try {
        const res = await fetch("https://gql.hashnode.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const json = await res.json();
        console.log("Hashnode API Response:", json);

        if (json.errors) {
          console.error("GraphQL Errors:", json.errors);
          setBlogs([]);
          return;
        }

        if (!json.data?.publication?.posts?.edges) {
          console.error("No publication or posts found. Response:", json);
          setBlogs([]);
          return;
        }

        const fetchedBlogs = json.data.publication.posts.edges.map(
          ({ node }) => ({
            title: node.title,
            caption: node.brief,
            image: node.coverImage?.url,
            slug: node.slug,
            publishedAt: node.publishedAt,
          })
        );

        console.log("Fetched blogs:", fetchedBlogs);
        console.log(
          "Total documents:",
          json.data.publication.posts.totalDocuments
        );
        setBlogs(fetchedBlogs);
      } catch (error) {
        console.error("Error fetching Hashnode blogs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHashnodeBlogs();
  }, []);

  if (loading) return <p className="p-[12rem] mt-[12rem]">Loading blogs...</p>;
  if (blogs.length === 0)
    return <p className="p-[12rem] mt-[12rem]">No blogs found.</p>;

  return (
    <div className="flex p-[12rem] mt-[11rem] bg-[var(--emphasis)] md:gap-[12rem] gap-[6rem] w-full items-center bg-[var(--background-color)]">
      <div className="flex flex-col bg-[var(--white)] w-full items-center gap-[4.8rem] shadow-xl pb-[1.8rem] md:w-full">
        <div id="main">
          <BlogPost
            image={blogs[activeBlog].image}
            title={blogs[activeBlog].title}
            content={blogs[activeBlog].caption}
            slug={blogs[activeBlog].slug}
          />
        </div>
        <div className="flex gap-[1.8rem] w-[98%] overflow-auto pb-[4.8rem] custom-scrollbar">
          {blogs.map((blog, index) => (
            <MiniBlogPost
              key={index}
              onSelect={() => setActiveBlog(index)}
              href="#main"
              image={blog.image}
              title={blog.title}
              caption={blog.caption}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
