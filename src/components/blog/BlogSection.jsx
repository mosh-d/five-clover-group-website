"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import BlogPost from "../shared/BlogPost";
import MiniBlogPost from "../shared/MiniBlogPost";

export default function BlogSection({ blogs }) {
  const [activeBlog, setActiveBlog] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const scrollContainerRef = useRef(null);
  const trackRef = useRef(null);

  // Update custom scrollbar thumb position when container scrolls
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const percentage =
      maxScroll > 0 ? (container.scrollLeft / maxScroll) * 100 : 0;
    setScrollPercentage(percentage);
  }, []);

  // Drag scrollbar thumb
  const handleThumbDrag = useCallback(
    (e) => {
      if (!isDragging) return;
      const track = trackRef.current;
      const container = scrollContainerRef.current;
      if (!track || !container) return;

      const trackRect = track.getBoundingClientRect();
      const relativeX = e.clientX - trackRect.left;
      const percentage = Math.max(
        0,
        Math.min(100, (relativeX / trackRect.width) * 100),
      );
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollLeft = (percentage / 100) * maxScroll;
    },
    [isDragging],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleThumbDrag);
    window.addEventListener("mouseup", () => setIsDragging(false));
    return () => {
      window.removeEventListener("mousemove", handleThumbDrag);
      window.removeEventListener("mouseup", () => setIsDragging(false));
    };
  }, [handleThumbDrag, isDragging]);

  if (!blogs || blogs.length === 0) {
    return (
      <p className="p-[12rem] mt-[12rem]">No blogs found. Check back soon!</p>
    );
  }

  return (
    <section className="flex p-[12rem] max-md:px-[6rem] max-sm:px-[2rem] md:gap-[12rem] gap-[6rem] w-full items-center bg-[var(--background-color)]">
      <div className="flex flex-col bg-[var(--white)] w-full items-center gap-[8rem] shadow-xl pb-[1.8rem]">
        <div id="main">
          <BlogPost
            image={blogs[activeBlog].image}
            title={blogs[activeBlog].title}
            content={blogs[activeBlog].caption}
            slug={blogs[activeBlog].slug}
          />
        </div>

        {/* Mini blogs — hidden native scrollbar */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-[1.8rem] w-[98%] overflow-x-auto overflow-y-hidden hide-scrollbar pb-[1.2rem]"
        >
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

        {/* Custom scrollbar track — matching Gallery/Explore style */}
        <div className="relative w-[98%] mb-[4.8rem]">
          <div
            ref={trackRef}
            className="w-1/2 h-[0.4rem] bg-[var(--accent-2)] relative cursor-pointer"
          >
            {/* Scrollbar thumb */}
            <div
              className="absolute top-0 h-full bg-[var(--text-color)] transition-colors hover:bg-[var(--black)] cursor-grab active:cursor-grabbing"
              style={{
                width: "50%",
                left: `${scrollPercentage * 0.5}%`,
              }}
              onMouseDown={() => setIsDragging(true)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
