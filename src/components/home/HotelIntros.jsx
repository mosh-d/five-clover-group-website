"use client";

import Carousel from "@/components/shared/Carousel";
import FONTS from "@/utils/fonts";
import UnderlinedButton from "@/components/shared/UnderlinedButton";

import FiveCloverLogo from "@/assets/home/hero/logos/five-clover-logo.png";
import CaritasLogo from "@/assets/home/hero/logos/caritas-logo.png";
import RingRubyLogo from "@/assets/home/hero/logos/ring-ruby-logo.png";
import CordisLogo from "@/assets/home/hero/logos/cordis-logo.png";

const LOGOS = [
  {
    name: "Five Clover",
    logo: FiveCloverLogo,
    id: "fc",
  },
  {
    name: "RingRuby",
    logo: RingRubyLogo,
    id: "rr",
  },
  {
    name: "Caritas",
    logo: CaritasLogo,
    id: "ci",
  },
  {
    name: "Cordis",
    logo: CordisLogo,
    id: "tc",
  },
];

export default function HotelIntros() {
  return (
    <div className="py-[12rem] gap-[24rem] max-sm:gap-[16rem] flex flex-col w-full">
      <div>
        <h2 className="text-[var(--text-color)] font-secondary text-[5.3rem] font-bold text-center">
          Our Brands
        </h2>
        <div className="flex max-sm:px-[2rem] gap-[8rem] max-md:gap-[4rem] max-sm:gap-[2.4rem] items-center justify-center">
          {LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex flex-col gap-[.1rem] items-center justify-center hover:cursor-pointer hover:scale-110 active:scale-100 transition-all duration-250"
              onClick={() => {
                const element = document.getElementById(logo.id);
                if (element) {
                  element.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }}
            >
              <img
                src={logo.logo.src}
                alt={`${logo.name} Hotel logo - Premium hospitality in Lagos, Nigeria`}
                className="size-[10rem] object-contain"
              />
              {/* <h3 className="text-[var(--white)] text-[1.4rem] font-medium text-center">
                  {logo.name}
                </h3> */}
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex max-lg:flex-col max-lg:gap-[4.8rem] items-stretch w-full"
        id="fc"
      >
        <Carousel brand="FIVECLOVER_IMAGES" />
        <div className="flex flex-col gap-[4.8rem] justify-center items-start max-lg:items-center w-[35%] max-lg:w-full px-[6rem] max-sm:px-[1rem] max-sm:py-[6rem]">
          <div className="flex flex-col gap-[1.8rem] max-lg:items-center">
            <h3 className={`${FONTS.context} max-lg:text-center`}>
              Five Clover Hotels
            </h3>
            <h4 className={`${FONTS.heading} max-lg:text-center`}>
              Our flagship properties
            </h4>
            <p className={`${FONTS.body} max-lg:text-center`}>
              At Monastery Road and Abijo GRA—embody the art of refined
              hospitality, welcoming you home with contemporary design and
              seamless service.
            </p>
          </div>
          <a
            href="#reservation"
            style={{ borderColor: "var(--emphasis)" }}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("reservation")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <UnderlinedButton>Reserve</UnderlinedButton>
          </a>
        </div>
      </div>

      <div
        className="flex max-lg:flex-col max-lg:gap-[4.8rem] items-stretch w-full"
        id="rr"
      >
        <Carousel brand="RINGRUBY_IMAGES" className="lg:hidden" />
        <div className="flex flex-col gap-[4.8rem] justify-center items-start max-lg:items-center w-[35%] max-lg:w-full px-[6rem] max-sm:px-[1rem]">
          <div className="flex flex-col gap-[1.8rem] max-lg:items-center">
            <h3 className={`${FONTS.context} max-lg:text-center`}>
              Ringruby Hotels
            </h3>
            <h4 className={`${FONTS.heading} max-lg:text-center`}>
              Discover vibrant boutique stays
            </h4>
            <p className={`${FONTS.body} max-lg:text-center`}>
              at Sangotedo, Eso Close, and Oduduwa—where each room tells a story
              of local culture and modern flair.
            </p>
          </div>
          <a
            href="#reservation"
            style={{ borderColor: "var(--emphasis)" }}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("reservation")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <UnderlinedButton>Reserve</UnderlinedButton>
          </a>
        </div>
        <Carousel brand="RINGRUBY_IMAGES" className="max-lg:hidden" />
      </div>

      <div
        className="flex max-lg:flex-col max-lg:gap-[4.8rem] items-stretch w-full"
        id="ci"
      >
        <Carousel brand="CARITAS_IMAGES" />
        <div className="flex flex-col gap-[4.8rem] justify-center items-start max-lg:items-center w-[35%] max-lg:w-full px-[6rem] max-sm:px-[1rem]">
          <div className="flex flex-col gap-[1.8rem] max-lg:items-center">
            <h3 className={`${FONTS.context} max-lg:text-center`}>
              Caritas Inns
            </h3>
            <h4 className={`${FONTS.heading} max-lg:text-center`}>
              From Lekki to Yaba
            </h4>
            <p className={`${FONTS.body} max-lg:text-center`}>
              Caritas Inns blend heartfelt service with thoughtful
              amenities—your cozy retreat in Nigeria’s bustling neighborhoods.
            </p>
          </div>
          <a
            href="#reservation"
            style={{ borderColor: "var(--emphasis)" }}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("reservation")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <UnderlinedButton>Reserve</UnderlinedButton>
          </a>
        </div>
      </div>

      <div
        className="flex max-lg:flex-col max-lg:gap-[4.8rem] items-stretch w-full"
        id="tc"
      >
        <Carousel brand="CORDIS_IMAGES" className="lg:hidden" />
        <div className="flex flex-col gap-[4.8rem] justify-center items-start max-lg:items-center w-[35%] max-lg:w-full px-[6rem] max-sm:px-[1rem]">
          <div className="flex flex-col gap-[1.8rem] max-lg:items-center">
            <h3 className={`${FONTS.context} max-lg:text-center`}>
              The Cordis Hotels
            </h3>
            <h4 className={`${FONTS.heading} max-lg:text-center`}>
              Our 4-star king in Ikeja
            </h4>
            <p className={`${FONTS.body} max-lg:text-center`}>
              Cordis Hotels—where every stay is a journey of comfort and
              sophistication, offering a unique blend of elegance and modern
              convenience.
            </p>
          </div>
          <a
            href="#reservation"
            style={{ borderColor: "var(--emphasis)" }}
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("reservation")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <UnderlinedButton>Reserve</UnderlinedButton>
          </a>
        </div>
        <Carousel brand="CORDIS_IMAGES" className="max-lg:hidden" />
      </div>
    </div>
  );
}
