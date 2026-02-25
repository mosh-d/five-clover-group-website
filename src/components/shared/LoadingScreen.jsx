"use client";

import { useState, useEffect } from "react";
import FONTS from "@/utils/fonts";
import FiveCloverLogo from "@/assets/five-clover-logo.png";

// Home page images
import FiveClover from "@/assets/home/hero/five-clover.jpg";
import FiveCloverLogoHero from "@/assets/home/hero/logos/five-clover-logo.png";
import CaritasLogo from "@/assets/home/hero/logos/caritas-logo.png";
import RingRubyLogo from "@/assets/home/hero/logos/ring-ruby-logo.png";
import CordisLogo from "@/assets/home/hero/logos/cordis-logo.png";
import miniabout from "@/assets/home/mini-about.jpg";

// Carousel images
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

// About page images
import About1 from "@/assets/about/about-1.jpg";
import About2 from "@/assets/about/about-2.jpg";
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

// Gallery images
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

const IMAGES_TO_PRELOAD = [
  FiveCloverLogo.src,
  FiveClover.src,
  FiveCloverLogoHero.src,
  CaritasLogo.src,
  RingRubyLogo.src,
  CordisLogo.src,
  miniabout.src,
  // Carousel images
  FiveClover1.src,
  FiveClover2.src,
  FiveClover3.src,
  FiveClover4.src,
  Caritas1.src,
  Caritas2.src,
  Caritas3.src,
  Caritas4.src,
  RingRuby1.src,
  RingRuby2.src,
  RingRuby3.src,
  RingRuby4.src,
  Cordis1.src,
  Cordis2.src,
  Cordis3.src,
  Cordis4.src,
  // About page images
  About1.src,
  About2.src,
  fiveCloverIlupeju.src,
  fiveCloverMonastery.src,
  fiveCloverAbijo.src,
  ringRubyValueCounty.src,
  ringRubyOduduwa.src,
  ringRubyEso.src,
  ringRubySangotedo.src,
  caritasLekki.src,
  caritasIlasan.src,
  caritasIgbobi.src,
  caritasYaba.src,
  cordisIkeja.src,
  // Gallery images
  gallery1.src,
  gallery2.src,
  gallery3.src,
  gallery4.src,
  gallery5.src,
  gallery6.src,
  gallery7.src,
  gallery8.src,
  gallery9.src,
  gallery10.src,
  gallery11.src,
  gallery12.src,
  gallery13.src,
  gallery14.src,
  gallery15.src,
  gallery16.src,
  gallery17.src,
  gallery18.src,
  gallery19.src,
  gallery20.src,
  gallery21.src,
  gallery22.src,
  gallery23.src,
  gallery24.src,
  gallery25.src,
  gallery26.src,
  gallery27.src,
  gallery28.src,
  gallery29.src,
  gallery30.src,
  gallery31.src,
  gallery32.src,
  gallery33.src,
  gallery34.src,
  gallery35.src,
  gallery36.src,
  gallery37.src,
  gallery38.src,
  gallery39.src,
  gallery40.src,
];

export default function LoadingScreen({ children }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if assets have already been loaded in this session
    const assetsLoaded = sessionStorage.getItem("assetsLoaded");

    if (assetsLoaded === "true") {
      // Assets already loaded, skip loading screen
      setLoading(false);
      return;
    }

    let loadedCount = 0;
    const totalImages = IMAGES_TO_PRELOAD.length;

    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / totalImages) * 100));
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          setProgress(Math.round((loadedCount / totalImages) * 100));
          resolve(); // Resolve anyway to not block loading
        };
        img.src = src;
      });
    };

    const loadAllImages = async () => {
      await Promise.all(IMAGES_TO_PRELOAD.map(preloadImage));
      // Mark assets as loaded in sessionStorage
      sessionStorage.setItem("assetsLoaded", "true");
      // Add a small delay for smooth transition
      setTimeout(() => {
        setLoading(false);
      }, 300);
    };

    loadAllImages();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--black)]">
        <div className="flex flex-col items-center gap-8">
          {/* Five Clover Logo */}
          <img
            src={FiveCloverLogo.src}
            alt="Five Clover Hotels Group Logo"
            className="w-[120px] h-auto max-sm:w-[100px]"
          />

          {/* Brand Name */}
          <h1
            className={`${FONTS.heading} text-[var(--text-color)] text-[3.6rem] max-sm:text-[2.4rem] text-center`}
          >
            Five Clover Hotels Group
          </h1>

          {/* Progress Bar */}
          <div className="w-[300px] max-sm:w-[250px] h-[4px] bg-[var(--light-gray)] bg-opacity-20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--emphasis)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress Text */}
          <p className={`${FONTS.body} text-[var(--white)]/50 text-[1.4rem]`}>
            Loading {progress}%
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
