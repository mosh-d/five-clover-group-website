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
    <div className="py-[12rem] gap-[24rem] flex flex-col w-full">
      <div>
        <h2 className="text-[var(--text-color)] font-secondary text-[5.3rem] font-bold text-center">
          Our Brands
        </h2>
        <div className="flex gap-[8rem] items-center justify-center">
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
                alt={logo.name}
                className="size-[10rem] object-contain"
              />
              {/* <h3 className="text-[var(--white)] text-[1.4rem] font-medium text-center">
                  {logo.name}
                </h3> */}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-stretch w-full" id="fc">
        <Carousel brand="FIVECLOVER_IMAGES" />
        <div className="flex flex-col gap-[4.8rem] justify-center items-start w-[35%] px-[12rem]">
          <div className="flex flex-col gap-[1.8rem]">
            <h3 className={`${FONTS.context}`}>Five Clover Hotels</h3>
            <h4 className={`${FONTS.heading}`}>Our flagship properties</h4>
            <p className={`${FONTS.body}`}>
              At Monastery Road and Abijo GRA—embody the art of refined
              hospitality, welcoming you home with contemporary design and
              seamless service.
            </p>
          </div>
          <UnderlinedButton>Reserve</UnderlinedButton>
        </div>
      </div>

      <div className="flex items-stretch w-full" id="rr">
        <div className="flex flex-col gap-[4.8rem] justify-center items-start w-[35%] px-[12rem]">
          <div className="flex flex-col gap-[1.8rem]">
            <h3 className={`${FONTS.context}`}>Ringruby Hotels</h3>
            <h4 className={`${FONTS.heading}`}>
              Discover vibrant boutique stays
            </h4>
            <p className={`${FONTS.body}`}>
              at Sangotedo, Eso Close, and Oduduwa—where each room tells a story
              of local culture and modern flair.
            </p>
          </div>
          <UnderlinedButton>Reserve</UnderlinedButton>
        </div>
        <Carousel brand="RINGRUBY_IMAGES" />
      </div>

      <div className="flex items-stretch w-full" id="ci">
        <Carousel brand="CARITAS_IMAGES" />
        <div className="flex flex-col gap-[4.8rem] justify-center items-start w-[35%] px-[12rem]">
          <div className="flex flex-col gap-[1.8rem]">
            <h3 className={`${FONTS.context}`}>Caritas Inns</h3>
            <h4 className={`${FONTS.heading}`}>From Lekki to Yaba</h4>
            <p className={`${FONTS.body}`}>
              Caritas Inns blend heartfelt service with thoughtful
              amenities—your cozy retreat in Nigeria’s bustling neighborhoods.
            </p>
          </div>
          <UnderlinedButton>Reserve</UnderlinedButton>
        </div>
      </div>

      <div className="flex items-stretch w-full" id="tc">
        <div className="flex flex-col gap-[4.8rem] justify-center items-start w-[35%] px-[12rem]">
          <div className="flex flex-col gap-[1.8rem]">
            <h3 className={`${FONTS.context}`}>The Cordis Hotels</h3>
            <h4 className={`${FONTS.heading}`}>Our 4-star king in Ikeja</h4>
            <p className={`${FONTS.body}`}>
              Cordis Hotels—where every stay is a journey of comfort and
              sophistication, offering a unique blend of elegance and modern
              convenience.
            </p>
          </div>
          <UnderlinedButton>Reserve</UnderlinedButton>
        </div>
        <Carousel brand="CORDIS_IMAGES" />
      </div>
    </div>
  );
}
