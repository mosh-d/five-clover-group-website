"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import FONTS from "@/utils/fonts";

import gallery1 from "@/assets/home/gallery/gallery-1.webp";
import gallery2 from "@/assets/home/gallery/gallery-2.webp";
import gallery3 from "@/assets/home/gallery/gallery-3.webp";
import gallery4 from "@/assets/home/gallery/gallery-4.webp";
import gallery5 from "@/assets/home/gallery/gallery-5.webp";
import gallery6 from "@/assets/home/gallery/gallery-6.webp";
import gallery7 from "@/assets/home/gallery/gallery-7.webp";
import gallery8 from "@/assets/home/gallery/gallery-8.webp";
import gallery9 from "@/assets/home/gallery/gallery-9.webp";
import gallery10 from "@/assets/home/gallery/gallery-10.webp";
import gallery11 from "@/assets/home/gallery/gallery-11.webp";
import gallery12 from "@/assets/home/gallery/gallery-12.webp";
import gallery13 from "@/assets/home/gallery/gallery-13.webp";
import gallery14 from "@/assets/home/gallery/gallery-14.webp";
import gallery15 from "@/assets/home/gallery/gallery-15.webp";
import gallery16 from "@/assets/home/gallery/gallery-16.webp";
import gallery17 from "@/assets/home/gallery/gallery-17.webp";
import gallery18 from "@/assets/home/gallery/gallery-18.webp";
import gallery19 from "@/assets/home/gallery/gallery-19.webp";
import gallery20 from "@/assets/home/gallery/gallery-20.webp";
import gallery21 from "@/assets/home/gallery/gallery-21.webp";
import gallery22 from "@/assets/home/gallery/gallery-22.webp";
import gallery23 from "@/assets/home/gallery/gallery-23.webp";
import gallery24 from "@/assets/home/gallery/gallery-24.webp";
import gallery25 from "@/assets/home/gallery/gallery-25.webp";
import gallery26 from "@/assets/home/gallery/gallery-26.webp";
import gallery27 from "@/assets/home/gallery/gallery-27.webp";
import gallery28 from "@/assets/home/gallery/gallery-28.webp";
import gallery29 from "@/assets/home/gallery/gallery-29.webp";
import gallery30 from "@/assets/home/gallery/gallery-30.webp";
import gallery31 from "@/assets/home/gallery/gallery-31.webp";
import gallery32 from "@/assets/home/gallery/gallery-32.webp";
import gallery33 from "@/assets/home/gallery/gallery-33.webp";
import gallery34 from "@/assets/home/gallery/gallery-34.webp";
import gallery35 from "@/assets/home/gallery/gallery-35.webp";
import gallery36 from "@/assets/home/gallery/gallery-36.webp";
import gallery37 from "@/assets/home/gallery/gallery-37.webp";
import gallery38 from "@/assets/home/gallery/gallery-38.webp";
import gallery39 from "@/assets/home/gallery/gallery-39.webp";
import gallery40 from "@/assets/home/gallery/gallery-40.webp";

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
  gallery12,
  gallery13,
  gallery14,
  gallery15,
  gallery16,
  gallery17,
  gallery18,
  gallery19,
  gallery20,
  gallery21,
  gallery22,
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
  gallery39,
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

  const handleThumbDrag = useCallback(
    (e) => {
      if (!isDragging || !scrollContainerRef.current || !trackRef.current)
        return;

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
    },
    [isDragging]
  );

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
  }, [handleThumbDrag, isDragging]);

  return (
    <div className="p-[12rem] max-lg:px-[4rem] max-sm:px-[2rem] flex max-md:flex-col gap-[6rem] max-md:-gap-[6rem]">
      <div className="w-[30%] max-md:w-full flex flex-col gap-[1.8rem]">
        <h1 className={`${FONTS.heading}`}>Check Our Hotels' Gallery</h1>
        <p className={`${FONTS.body} text-[var(--light-gray)]`}>
          Check out our hotel gallery to see the luxury and comfort that awaits you. From rooms, to restaurants and bars, to pools and gyms. etc.
        </p>
      </div>
      <div className="w-[70%] max-md:w-full flex flex-col">
        {/* Images container with hidden scrollbar */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-nowrap gap-[2.4rem] max-sm:gap-[1.2rem] overflow-x-auto overflow-y-hidden hide-scrollbar"
        >
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative w-[30rem] max-sm:w-[22rem] h-[37.5rem] max-sm:h-[26rem] flex-shrink-0"
            >
              <Image
                src={image}
                alt={`Five Clover Hotels Group gallery image ${index + 1} - Luxury hotel rooms and amenities in Lagos, Nigeria`}
                fill
                sizes="(max-width: 640px) 22rem, 30rem"
                className="object-cover"
                loading="lazy"
                quality={85}
              />
            </div>
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
