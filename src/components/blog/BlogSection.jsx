"use client";

import { useState } from "react";
import BlogPost from "../shared/BlogPost";
import MiniBlogPost from "../shared/MiniBlogPost";

export default function BlogSection({ blogs }) {
  const [activeBlog, setActiveBlog] = useState(0);

  if (!blogs || blogs.length === 0) {
    return (
      <p className="p-[12rem] mt-[12rem]">No blogs found. Check back soon!</p>
    );
  }

  return (
    <div className="flex p-[12rem] max-md:px-[6rem] max-sm:px-[2rem] mt-[11rem] bg-[var(--emphasis)] md:gap-[12rem] gap-[6rem] w-full items-center bg-[var(--background-color)]">
      <div className="flex flex-col bg-[var(--white)] w-full items-center gap-[8rem] shadow-xl pb-[1.8rem] md:w-full">
        <div id="main">
          <BlogPost
            image={blogs[activeBlog].image}
            title={blogs[activeBlog].title}
            content={blogs[activeBlog].caption}
            slug={blogs[activeBlog].slug}
          />
        </div>
        <div className="flex gap-[1.8rem] w-[98%] overflow-x-auto pb-[4.8rem] custom-scrollbar">
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
