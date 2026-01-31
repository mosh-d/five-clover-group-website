"use client";

import { useState } from "react";
import FiveClover1 from "@/assets/home/five-clover/five-clover-1.jpg";
import FiveClover2 from "@/assets/home/five-clover/five-clover-2.jpg";
import FiveClover3 from "@/assets/home/five-clover/five-clover-3.jpg";
import FiveClover4 from "@/assets/home/five-clover/five-clover-4.jpg";
import Caritas1 from "@/assets/home/caritas/caritas-1.jpg";
import Caritas2 from "@/assets/home/caritas/caritas-2.jpg";
import Caritas3 from "@/assets/home/caritas/caritas-3.jpg";
import Caritas4 from "@/assets/home/caritas/caritas-4.jpg";
import RingRuby1 from "@/assets/home/ring-ruby/ring-ruby-1.jpg";
import RingRuby2 from "@/assets/home/ring-ruby/ring-ruby-2.jpg";
import RingRuby3 from "@/assets/home/ring-ruby/ring-ruby-3.jpg";
import RingRuby4 from "@/assets/home/ring-ruby/ring-ruby-4.jpg";
import Cordis1 from "@/assets/home/cordis/cordis-1.jpg";
import Cordis2 from "@/assets/home/cordis/cordis-2.jpg";
import Cordis3 from "@/assets/home/cordis/cordis-3.jpg";
import Cordis4 from "@/assets/home/cordis/cordis-4.jpg";

const FIVECLOVER_IMAGES = [
  {
    src: FiveClover1,
    alt: "Five Clover 1",
  },
  {
    src: FiveClover2,
    alt: "Five Clover 2",
  },
  {
    src: FiveClover3,
    alt: "Five Clover 3",
  },
  {
    src: FiveClover4,
    alt: "Five Clover 4",
  },
];

const CARITAS_IMAGES = [
  {
    src: Caritas1,
    alt: "Caritas 1",
  },
  {
    src: Caritas2,
    alt: "Caritas 2",
  },
  {
    src: Caritas3,
    alt: "Caritas 3",
  },
  {
    src: Caritas4,
    alt: "Caritas 4",
  },
];

const RINGRUBY_IMAGES = [
  {
    src: RingRuby1,
    alt: "RingRuby 1",
  },
  {
    src: RingRuby2,
    alt: "RingRuby 2",
  },
  {
    src: RingRuby3,
    alt: "RingRuby 3",
  },
  {
    src: RingRuby4,
    alt: "RingRuby 4",
  },
];

const CORDIS_IMAGES = [
  {
    src: Cordis1,
    alt: "Cordis 1",
  },
  {
    src: Cordis2,
    alt: "Cordis 2",
  },
  {
    src: Cordis3,
    alt: "Cordis 3",
  },
  {
    src: Cordis4,
    alt: "Cordis 4",
  },
];

export default function Carousel({ brand }) {
  // Map brand name string to actual image array
  const brandMap = {
    FIVECLOVER_IMAGES,
    CARITAS_IMAGES,
    RINGRUBY_IMAGES,
    CORDIS_IMAGES,
  };

  // Get the actual images array from the brand name
  const images = brandMap[brand] || FIVECLOVER_IMAGES; // Default to Five Clover

  // ✅ useState INSIDE the component, with proper destructuring
  const [index, setIndex] = useState({ main: 0, left: 1, right: 2 });

  // ✅ handleNext INSIDE the component so it can access 'images'
  const handleNext = () => {
    setIndex((prevIndex) => {
      const newMain = prevIndex.right;
      const newRight =
        prevIndex.right === images.length - 1 ? 0 : prevIndex.right + 1;
      const newLeft = newMain;

      return { main: newMain, left: newLeft, right: newRight };
    });
  };

  return (
    <div className="flex flex-col gap-[2rem] min-h-[0rem] items-center w-[60%] shrink-0">
      <div className="relative flex w-full aspect-video items-center bg-red-500">
        <div className="absolute left-[50%] translate-x-[-50%] z-20 w-[50%] aspect-square">
          <img
            src={images[index.main].src.src}
            alt={images[index.main].alt}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute left-0 z-10 w-[40%] aspect-square">
          <img
            src={images[index.left].src.src}
            alt={images[index.left].alt}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute right-0 z-10 w-[40%] aspect-square">
          <img
            src={images[index.right].src.src}
            alt={images[index.right].alt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="flex w-[40%] justify-between">
        <button onClick={handleNext}>Previous</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}
