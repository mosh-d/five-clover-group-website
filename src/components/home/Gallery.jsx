"use client";

import { useRef, useState, useEffect } from "react";
import FONTS from "@/utils/fonts";

import gallery1 from "@/assets/home/gallery/gallery-1.jpg";
import gallery2 from "@/assets/home/gallery/gallery-2.jpg";
import gallery3 from "@/assets/home/gallery/gallery-3.jpg";
import gallery4 from "@/assets/home/gallery/gallery-4.jpg";
import gallery5 from "@/assets/home/gallery/gallery-5.jpg";
import gallery6 from "@/assets/home/gallery/gallery-6.jpg";
import gallery7 from "@/assets/home/gallery/gallery-7.jpg";
import gallery8 from "@/assets/home/gallery/gallery-8.jpg";
import gallery9 from "@/assets/home/gallery/gallery-9.jpg";
import gallery10 from "@/assets/home/gallery/gallery-10.jpg";
import gallery11 from "@/assets/home/gallery/gallery-11.jpg";
import gallery12 from "@/assets/home/gallery/gallery-12.jpg";
import gallery13 from "@/assets/home/gallery/gallery-13.jpg";
import gallery14 from "@/assets/home/gallery/gallery-14.jpg";
import gallery15 from "@/assets/home/gallery/gallery-15.jpg";
import gallery16 from "@/assets/home/gallery/gallery-16.jpg";
import gallery17 from "@/assets/home/gallery/gallery-17.jpg";
import gallery18 from "@/assets/home/gallery/gallery-18.jpg";
import gallery19 from "@/assets/home/gallery/gallery-19.jpg";
import gallery20 from "@/assets/home/gallery/gallery-20.jpg";
import gallery21 from "@/assets/home/gallery/gallery-21.jpg";
import gallery22 from "@/assets/home/gallery/gallery-22.jpg";
import gallery23 from "@/assets/home/gallery/gallery-23.jpg";
import gallery24 from "@/assets/home/gallery/gallery-24.jpg";
import gallery25 from "@/assets/home/gallery/gallery-25.jpg";
import gallery26 from "@/assets/home/gallery/gallery-26.jpg";
import gallery27 from "@/assets/home/gallery/gallery-27.jpg";
import gallery28 from "@/assets/home/gallery/gallery-28.jpg";
import gallery29 from "@/assets/home/gallery/gallery-29.jpg";
import gallery30 from "@/assets/home/gallery/gallery-30.jpg";
import gallery31 from "@/assets/home/gallery/gallery-31.jpg";
import gallery32 from "@/assets/home/gallery/gallery-32.jpg";
import gallery33 from "@/assets/home/gallery/gallery-33.jpg";
import gallery34 from "@/assets/home/gallery/gallery-34.jpg";
import gallery35 from "@/assets/home/gallery/gallery-35.jpg";
import gallery36 from "@/assets/home/gallery/gallery-36.jpg";
import gallery37 from "@/assets/home/gallery/gallery-37.jpg";
import gallery38 from "@/assets/home/gallery/gallery-38.jpg";
import gallery39 from "@/assets/home/gallery/gallery-39.jpg";
import gallery40 from "@/assets/home/gallery/gallery-40.jpg";

const galleryImages = [
  gallery1,
  gallery2,
  gallery3,
  gallery4,
  gallery5,
  gallery6,
  gallery7,
  gallery8,
  gallery9,
  gallery10,
  gallery11,
  gallery13,
  gallery14,
  gallery15,
  gallery17,
  gallery18,
  gallery19,
  gallery20,
  gallery21,
  gallery23,
  gallery24,
  gallery25,
  gallery26,
  gallery27,
  gallery28,
  gallery29,
  gallery30,
  gallery31,
  gallery32,
  gallery33,
  gallery34,
  gallery35,
  gallery36,
  gallery37,
  gallery38,
  gallery40,
];

export default function Gallery() {
  const scrollContainerRef = useRef(null);
  const trackRef = useRef(null);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const percentage = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollPercentage(percentage);
    }
  };

  const handleThumbDrag = (e) => {
    if (!isDragging || !scrollContainerRef.current || !trackRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const thumbWidth = trackWidth * 0.5; // 50% thumb width
    const maxThumbPosition = trackWidth - thumbWidth;

    let newPosition = e.clientX - trackRect.left - thumbWidth / 2;
    newPosition = Math.max(0, Math.min(newPosition, maxThumbPosition));

    const percentage = (newPosition / maxThumbPosition) * 100;
    const { scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    scrollContainerRef.current.scrollLeft = (percentage / 100) * maxScroll;
  };

  useEffect(() => {
    const handleMouseMove = (e) => handleThumbDrag(e);
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="p-[12rem] flex gap-[6rem]">
      <div className="w-[30%] flex flex-col gap-[1.8rem]">
        <h1 className={`${FONTS.heading}`}>Check Our Hotels Gallery</h1>
        <p className={`${FONTS.body} text-[var(--light-gray)]`}>
          We are the people's choice for those who seek more from their journey.
          Nestled in the heart of Lagos, our hotels redefine hospitality,
          offering a symphony of comfort, luxury, and unmatched service.
        </p>
      </div>
      <div className="w-[70%] flex flex-col">
        {/* Images container with hidden scrollbar */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-nowrap gap-[2.4rem] overflow-x-auto overflow-y-hidden hide-scrollbar"
        >
          {galleryImages.map((image, index) => (
            <img
              key={index}
              src={image.src}
              alt="gallery"
              className="w-[30rem] h-[37.5rem] object-cover flex-shrink-0"
            />
          ))}
        </div>

        {/* Custom scrollbar track - 50% width, centered */}
        <div className="relative w-full mt-[2.4rem]">
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
    </div>
  );
}
