"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FONTS from "@/utils/fonts";
import { RiArrowLeftLine } from "react-icons/ri";

export default function FullBlogPage({ params }) {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    // Unwrap params in useEffect for Next.js 15+
    Promise.resolve(params).then((resolvedParams) => {
      setSlug(resolvedParams.slug);
    });
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function fetchBlog() {
      const query = `
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
      `;

      try {
        const res = await fetch("https://gql.hashnode.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            variables: {
              slug,
              host: "fivecloverhotels.hashnode.dev",
            },
          }),
        });

        const json = await res.json();
        console.log("Hashnode response:", json);

        setBlog(json.data?.publication?.post || null);
      } catch (error) {
        console.error("Error fetching full blog:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [slug]);

  if (loading) return <p className="p-[4rem]">Loading full blog...</p>;
  if (!blog) return <p className="p-[4rem]">Blog not found.</p>;

  return (
    <div className="p-[4rem] max-w-[120rem] mx-auto">
      <Link href="/blog">
        <button className="mb-[2rem] hover:scale-110 transition-transform">
          <RiArrowLeftLine color="var(--black)" size="3rem" />
        </button>
      </Link>
      <h1 className={`${FONTS.heading} mb-[2rem]`}>{blog.title}</h1>
      {blog.coverImage && (
        <img
          src={blog.coverImage.url}
          alt={blog.title}
          className="w-full mt-[2rem] rounded-[1.2rem]"
        />
      )}
      <div
        className="mt-[2rem] font-secondary text-[1.8rem] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: blog.content.html }}
      />
    </div>
  );
}
