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
      const query = `
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
      `;

      try {
        const res = await fetch("https://gql.hashnode.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const json = await res.json();
        const fetchedBlogs = json.data.publication.posts.edges.map(({ node }) => ({
          title: node.title,
          caption: node.brief,
          image: node.coverImage?.url,
          slug: node.slug,
        }));

        setBlogs(fetchedBlogs);
      } catch (error) {
        console.error("Error fetching Hashnode blogs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHashnodeBlogs();
  }, []);

  if (loading) return <p className="p-[2rem]">Loading blogs...</p>;
  if (blogs.length === 0) return <p className="p-[2rem]">No blogs found.</p>;

  return (
    <div className="flex p-[12rem] lg:p-[6rem] md:flex-col md:p-[4rem] md:gap-[12rem] gap-[6rem] w-full items-center bg-[var(--background-color)]">
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
