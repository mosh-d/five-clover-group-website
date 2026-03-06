"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

//Icons
import { CgArrowLongLeft, CgArrowLongRight } from "react-icons/cg";

const FIVECLOVER_IMAGES = [
  {
    src: FiveClover1,
    alt: "Five Clover Hotel - Luxury hotel room with modern amenities and elegant design",
  },
  {
    src: FiveClover2,
    alt: "Five Clover Hotel - Premium hotel lobby and reception area",
  },
  {
    src: FiveClover3,
    alt: "Five Clover Hotel - Spacious hotel suite with contemporary furnishings",
  },
  {
    src: FiveClover4,
    alt: "Five Clover Hotel - Hotel facilities and guest amenities",
  },
];

const CARITAS_IMAGES = [
  {
    src: Caritas1,
    alt: "Caritas Inn - Comfortable hotel room with modern facilities",
  },
  {
    src: Caritas2,
    alt: "Caritas Inn - Welcoming hotel entrance and reception",
  },
  {
    src: Caritas3,
    alt: "Caritas Inn - Cozy guest room with thoughtful amenities",
  },
  {
    src: Caritas4,
    alt: "Caritas Inn - Hotel common areas and facilities",
  },
];

const RINGRUBY_IMAGES = [
  {
    src: RingRuby1,
    alt: "Ring Ruby Hotel - Boutique hotel room with vibrant local design",
  },
  {
    src: RingRuby2,
    alt: "Ring Ruby Hotel - Stylish hotel interior with contemporary flair",
  },
  {
    src: RingRuby3,
    alt: "Ring Ruby Hotel - Elegant guest room with modern amenities",
  },
  {
    src: RingRuby4,
    alt: "Ring Ruby Hotel - Hotel facilities and guest services",
  },
];

const CORDIS_IMAGES = [
  {
    src: Cordis1,
    alt: "The Cordis Hotel - 4-star hotel room with sophisticated design",
  },
  {
    src: Cordis2,
    alt: "The Cordis Hotel - Premium hotel lobby in Ikeja, Lagos",
  },
  {
    src: Cordis3,
    alt: "The Cordis Hotel - Luxurious guest suite with modern conveniences",
  },
  {
    src: Cordis4,
    alt: "The Cordis Hotel - Hotel amenities and business facilities",
  },
];

// Helper function to get position class based on role
const getPositionStyles = (position) => {
  switch (position) {
    case "left":
      return "absolute left-0 z-10 w-[40%] max-sm:w-[30%]";
    case "main":
      return "absolute left-[50%] translate-x-[-50%] z-20 w-[60%] max-sm:w-[80%]";
    case "right":
      return "absolute right-0 z-10 w-[40%] max-sm:w-[30%]";
    default:
      return "";
  }
};

export default function Carousel({ brand, className }) {
  // Map brand name string to actual image array
  const brandMap = {
    FIVECLOVER_IMAGES,
    CARITAS_IMAGES,
    RINGRUBY_IMAGES,
    CORDIS_IMAGES,
  };

  const images = brandMap[brand] || FIVECLOVER_IMAGES;

  const [index, setIndex] = useState({ main: 0, left: 1, right: 2 });
  const [clickAnimation, setClickAnimation] = useState(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Track which position each image index is currently in
  const getPosition = (imgIndex) => {
    if (imgIndex === index.main) return "main";
    if (imgIndex === index.left) return "left";
    if (imgIndex === index.right) return "right";
    return null;
  };

  const handleNext = () => {
    setClickAnimation("next");
    setTimeout(() => setClickAnimation(null), 300);
    setIndex((prevIndex) => {
      const newMain = prevIndex.right;
      const newRight =
        prevIndex.right === images.length - 1 ? 0 : prevIndex.right + 1;
      const newLeft = prevIndex.main;

      return { main: newMain, left: newLeft, right: newRight };
    });
  };

  const handlePrevious = () => {
    setClickAnimation("prev");
    setTimeout(() => setClickAnimation(null), 300);
    setIndex((prevIndex) => {
      const newMain = prevIndex.left;
      const newRight = prevIndex.main;
      const newLeft =
        prevIndex.left === 0 ? images.length - 1 : prevIndex.left - 1;

      return { main: newMain, left: newLeft, right: newRight };
    });
  };

  // Touch event handlers for swipe detection
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - go to next
        handleNext();
      } else {
        // Swiped right - go to previous
        handlePrevious();
      }
    }
    
    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div
      className={`flex flex-col gap-[4rem] max-lg:gap-[1.8rem] items-center w-[65%] max-lg:w-full max-lg:px-[4.8rem] max-sm:px-0 shrink-0 ${className}`}
    >
      <div 
        className="relative flex w-full aspect-video items-center overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="popLayout">
          {images.map((image, imgIndex) => {
            const position = getPosition(imgIndex);
            if (!position) return null;

            return (
              <motion.div
                key={imgIndex}
                layout
                initial={{ opacity: 0 }}
                animate={{
                  opacity: position === "main" ? 1 : 0.7,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  layout: { duration: 0.6, ease: "backOut" },
                  opacity: { duration: 0.1 },
                }}
                className={`${getPositionStyles(position)} aspect-square ${
                  position === "main"
                    ? "shadow-[0_0_5rem_0_rgba(0,0,0,.1)]"
                    : ""
                }`}
              >
                <img
                  src={image.src.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex w-[40%] max-sm:w-[70%] h-[4rem] z-0 justify-between">
        <button
          onClick={handlePrevious}
          className="flex items-center gap-[1rem] cursor-pointer px-[2rem] py-[.5rem] border-[1px] border-transparent hover:border-[var(--text-color)] active:border-[var(--text-color)]/30 transition-all duration-300 ease-in-out"
        >
          <motion.div
            animate={{ x: clickAnimation === "prev" ? "-1rem" : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <CgArrowLongLeft size="3rem" />
          </motion.div>
          <p className="text-[1.4rem] mt-[.4rem]">Prev</p>
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-[1rem] cursor-pointer px-[2rem] py-[.5rem] border-[1px] border-transparent  hover:border-[var(--text-color)] active:border-[var(--text-color)]/30 transition-all duration-300 ease-in-out"
        >
          <p className="text-[1.4rem] mt-[.4rem]">Next</p>
          <motion.div
            animate={{ x: clickAnimation === "next" ? "1rem" : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <CgArrowLongRight size="3rem" />
          </motion.div>
        </button>
      </div>
    </div>
  );
}
