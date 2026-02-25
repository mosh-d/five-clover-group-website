"use client";

import { useRef, useState } from "react";
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

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const percentage = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollPercentage(percentage);
    }
  };

  return (
    <>
      <section className="p-[12rem] max-lg:px-[6rem] max-md:px-[2rem] flex max-md:flex-col gap-[6rem]">
        <div className="w-[30%] max-md:w-full flex flex-col gap-[1.8rem]">
          <h2 className={`${FONTS.heading}`}>Explore Our Hotels</h2>
          <p className={`${FONTS.body} text-[var(--light-gray)]`}>
            With nine strategically located branches, Five Clover Hotels offers
            a variety of experiences tailored to meet the needs of our guests.
          </p>
        </div>
        <div className="w-[70%] max-md:w-full flex flex-col">
          {/* Images container with hidden scrollbar */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex flex-nowrap gap-[2.4rem] h-auto overflow-x-auto overflow-y-hidden hide-scrollbar"
          >
            <a
              href="https://ilupeju.fivecloverhotels.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] max-sm:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={fiveCloverIlupeju.src}
                  alt="Five Clover Hotel Ilupeju - Luxury hotel in Ilupeju, Lagos with easy access to business districts"
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
            </a>
            <a
              href="https://monastery.fivecloverhotels.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={fiveCloverMonastery.src}
                  alt="Five Clover Hotel Monastery - Lavishly furnished hotel in secure serene environment, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Five Clover Hotel</h3>
                  <h4 className={`${FONTS.heading}`}>Monastery</h4>
                  <p className={`${FONTS.body}`}>
                    Nestled in a secure and serene environment, Five Clover
                    Hotel offers lavishly furnished rooms equipped with modern
                    facilities.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://abijogra.fivecloverhotels.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={fiveCloverAbijo.src}
                  alt="Five Clover Hotel Abijo GRA - Premium hotel with exceptional service in Abijo, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Five Clover Hotel</h3>
                  <h4 className={`${FONTS.heading}`}>Abijo</h4>
                  <p className={`${FONTS.body}`}>
                    Our commitment to ensuring a memorable stay is evident in
                    the exceptional elements that set us apart.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://ringrubyvaluecounty.fivecloverhotels.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={ringRubyValueCounty.src}
                  alt="Ring Ruby Hotel Value County - Serene boutique hotel in Value County Estate, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                  <h4 className={`${FONTS.heading}`}>Value County</h4>
                  <p className={`${FONTS.body}`}>
                    Ring Ruby Hotel Value County is situated within the serene
                    and secure Value County Estate, providing a calm and private
                    stay experience.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://ringrubyhotelesoikejagra.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={ringRubyEso.src}
                  alt="Ring Ruby Hotel Eso Close - Contemporary boutique hotel in Ikeja GRA with West African hospitality"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                  <h4 className={`${FONTS.heading}`}>Eso Close</h4>
                  <p className={`${FONTS.body}`}>
                    RingRuby Hotel, located in Eso Close, Ikeja GRA embodies
                    West African hospitality with its blend of contemporary
                    design and warm service.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://ringrubyhoteloduduwaikejagra.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={ringRubyOduduwa.src}
                  alt="Ring Ruby Hotel Oduduwa Way - Serene boutique hotel in Ikeja GRA, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                  <h4 className={`${FONTS.heading}`}>Oduduwa Way</h4>
                  <p className={`${FONTS.body}`}>
                    Nestled in the serene Sade Onigbajo Close, just off 34
                    Oduduwa Way in Ikeja GRA.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://ringrubyhotelsangotedo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={ringRubySangotedo.src}
                  alt="Ring Ruby Hotel Sangotedo - Tranquil boutique hotel in United Estate, Sangotedo, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Ringruby Hotel</h3>
                  <h4 className={`${FONTS.heading}`}>Sangotedo</h4>
                  <p className={`${FONTS.body}`}>
                    RingRuby Hotel, located in United Estate, Sangotedo,
                    provides a tranquil environment, exceptional services, and a
                    hospitable atmosphere.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://www.caritasinnlekkihotel.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={caritasLekki.src}
                  alt="Caritas Inn Lekki - Comfortable hotel in Lekki Phase 1, Lagos near Adiba Supermarket"
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
            </a>
            <a
              href="https://www.caritasinnilasanhotel.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={caritasIlasan.src}
                  alt="Caritas Inn Ilasan - Luxury hospitality haven in Ilasan, Lekki, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Caritas Inn</h3>
                  <h4 className={`${FONTS.heading}`}>Ilasan</h4>
                  <p className={`${FONTS.body}`}>
                    Discover comfort and luxury at Caritas Inn, Ilasan—your
                    ultimate hospitality haven located at 2, Howard Edafe
                    Street, Ilasan, Lekki.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://www.caritasinnigbobihotel.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={caritasIgbobi.src}
                  alt="Caritas Inn Igbobi - Peaceful and relaxing hotel with exceptional hospitality in Igbobi, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Caritas Inn</h3>
                  <h4 className={`${FONTS.heading}`}>Igbobi</h4>
                  <p className={`${FONTS.body}`}>
                    Caritas Inn, Igbobi prides itself on its hospitality, and
                    our services are exceptional. The inn offers a peaceful,
                    quiet, and relaxing atmosphere.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://www.caritasinnyabahotel.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={caritasYaba.src}
                  alt="Caritas Inn Yaba - Convenient hotel on Herbert Macaulay Way, Yaba, Lagos"
                  className="w-full aspect-square object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-[1.8rem]">
                  <h3 className={`${FONTS.context}`}>Caritas Inn</h3>
                  <h4 className={`${FONTS.heading}`}>Yaba</h4>
                  <p className={`${FONTS.body}`}>
                    Caritas Inn Yaba is conveniently situated at plot 336,
                    Herbert Macaulay Way, beside the GTB library in Yaba.
                  </p>
                </div>
              </div>
            </a>
            <a
              href="https://www.thecordishotelikeja.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block touch-manipulation"
            >
              <div className="h-full w-[30rem] max-lg:w-[20rem] flex-shrink-0 flex flex-col gap-[2.4rem] hover:bg-[var(--text-color)]/20 transition-colors duration-300">
                <img
                  src={cordisIkeja.src}
                  alt="The Cordis Hotel Ikeja - 4-star hotel in Ikeja, Lagos near corporate offices and shopping centers"
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
            </a>
          </div>

          {/* Custom scrollbar track - 50% width, centered */}
          <div className="relative w-full mt-[2.4rem]">
            <div
              ref={trackRef}
              className="w-1/2 h-[0.4rem] bg-[var(--accent-2)] relative"
            >
              {/* Scrollbar thumb */}
              <div
                className="absolute top-0 h-full bg-[var(--text-color)] transition-colors hover:bg-[var(--black)] pointer-events-none"
                style={{
                  width: "50%",
                  left: `${scrollPercentage * 0.5}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
