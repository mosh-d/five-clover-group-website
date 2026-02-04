"use client";

import { useRef, useState, useEffect } from "react";
import FONTS from "@/utils/fonts";

// Images
import fiveCloverIlupeju from "@/assets/about/explore/five-clover/ilupeju.jpg";
import fiveCloverMonastery from "@/assets/about/explore/five-clover/monastery.jpg";
import fiveCloverAbijo from "@/assets/about/explore/five-clover/abijo.jpg";
import ringRubyValueCounty from "@/assets/about/explore/ring-ruby/value-county.jpg";
import ringRubyOduduwa from "@/assets/about/explore/ring-ruby/oduduwa.jpg";
import ringRubyEso from "@/assets/about/explore/ring-ruby/eso.jpg";
import ringRubySangotedo from "@/assets/about/explore/ring-ruby/sangotedo.jpg";
import caritasLekki from "@/assets/about/explore/caritas/lekki.jpg";
import caritasIlasan from "@/assets/about/explore/caritas/ilasan.jpg";
import caritasIgbobi from "@/assets/about/explore/caritas/igbobi.jpg";
import caritasYaba from "@/assets/about/explore/caritas/yaba.jpg";
import cordisIkeja from "@/assets/about/explore/cordis/ikeja.jpg";

export default function Explore() {
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
    <>
      <div className="p-[12rem] flex gap-[6rem]">
        <div className="w-[30%] flex flex-col gap-[1.8rem]">
          <h1 className={`${FONTS.heading}`}>Explore Our Hotels</h1>
          <p className={`${FONTS.body} text-[var(--light-gray)]`}>
            With nine strategically located branches, Five Clover Hotels offers
            a variety of experiences tailored to meet the needs of our guests.
          </p>
        </div>
        <div className="w-[70%] flex flex-col">
          {/* Images container with hidden scrollbar */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex flex-nowrap gap-[2.4rem] h-auto overflow-x-auto overflow-y-hidden hide-scrollbar"
          >
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={fiveCloverIlupeju.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Five Clover Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Ilupeju</h4>
                <p className={`${FONTS.body}`}>
                  Five Clover Hotel Ilupeju is located in the vibrant Ilupeju
                  axis of Lagos, offering easy access to major business
                  districts and transport routes.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={fiveCloverMonastery.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Five Clover Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Monastery</h4>
                <p className={`${FONTS.body}`}>
                  Nestled in a secure and serene environment, Five Clover Hotel
                  offers lavishly furnished rooms equipped with modern
                  facilities.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={fiveCloverAbijo.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Five Clover Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Abijo</h4>
                <p className={`${FONTS.body}`}>
                  Our commitment to ensuring a memorable stay is evident in the
                  exceptional elements that set us apart.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={ringRubyValueCounty.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Value County</h4>
                <p className={`${FONTS.body}`}>
                  Ring Ruby Hotel Value County is situated within the serene and
                  secure Value County Estate, providing a calm and private stay
                  experience.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={ringRubyEso.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Eso Close</h4>
                <p className={`${FONTS.body}`}>
                  RingRuby Hotel, located in Eso Close, Ikeja GRA embodies West
                  African hospitality with its blend of contemporary design and
                  warm service.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={ringRubyOduduwa.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Oduduwa Way</h4>
                <p className={`${FONTS.body}`}>
                  Nestled in the serene Sade Onigbajo Close, just off 34 Oduduwa
                  Way in Ikeja GRA.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={ringRubySangotedo.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Sangotedo</h4>
                <p className={`${FONTS.body}`}>
                  RingRuby Hotel, located in United Estate, Sangotedo, provides
                  a tranquil environment, exceptional services, and a hospitable
                  atmosphere.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={caritasLekki.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Caritas Inn</h3>
                <h4 className={`${FONTS.heading}`}>Lekki</h4>
                <p className={`${FONTS.body}`}>
                  Caritas Inn Lekki is situated at 3 Ibiyinka Salvador Street,
                  Off African Lane, Lekki Phase 1. It is conveniently located
                  close to Adiba Supermarket and Ebeano Supermarket.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={caritasIlasan.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Caritas Inn</h3>
                <h4 className={`${FONTS.heading}`}>Ilasan</h4>
                <p className={`${FONTS.body}`}>
                  Discover comfort and luxury at Caritas Inn, Ilasan—your
                  ultimate hospitality haven located at 2, Howard Edafe Street,
                  Ilasan, Lekki.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={caritasIgbobi.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Caritas Inn</h3>
                <h4 className={`${FONTS.heading}`}>Igbobi</h4>
                <p className={`${FONTS.body}`}>
                  Caritas Inn, Igbobi prides itself on its hospitality, and our
                  services are exceptional. The inn offers a peaceful, quiet,
                  and relaxing atmosphere.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={caritasYaba.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>Caritas Inn</h3>
                <h4 className={`${FONTS.heading}`}>Yaba</h4>
                <p className={`${FONTS.body}`}>
                  Caritas Inn Yaba is conveniently situated at plot 336, Herbert
                  Macaulay Way, beside the GTB library in Yaba.
                </p>
              </div>
            </div>
            <div className="h-full w-[30rem] flex-shrink-0 flex flex-col gap-[2.4rem]">
              <img
                src={cordisIkeja.src}
                alt="gallery"
                className="w-full aspect-square object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[1.8rem]">
                <h3 className={`${FONTS.context}`}>The Cordis Hotel</h3>
                <h4 className={`${FONTS.heading}`}>Ikeja</h4>
                <p className={`${FONTS.body}`}>
                  Cordis Hotel Ikeja is a four-star property located in the
                  heart of Ikeja, Lagos, close to major corporate offices,
                  shopping centers, and key transport links.
                </p>
              </div>
            </div>
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
    </>
  );
}
