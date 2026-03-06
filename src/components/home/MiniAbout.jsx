import Image from "next/image";
import Button from "../shared/Button";
import FONTS from "@/utils/fonts";

import miniabout from "@/assets/home/mini-about.webp";

export default function MiniAbout() {
  return (
    <div className="w-full p-[12rem] max-lg:px-[4rem] max-sm:px-[2rem] flex max-md:flex-col">
      <div className="relative w-[40%] max-md:w-full aspect-square max-md:aspect-video">
        <Image
          src={miniabout}
          alt="Five Clover Hotels Group - Luxury hotel interior showcasing elegant design and premium amenities in Lagos, Nigeria"
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover"
          priority
          quality={90}
        />
      </div>
      <div className="flex flex-col justify-between max-md:items-center gap-[4.8rem] w-[60%] max-md:w-full bg-[var(--accent-2)] p-[12rem] max-lg:px-[4rem] max-sm:p-[2rem] max-sm:py-[6rem]">
        <div className="flex flex-col gap-[1.8rem]">
          <h2 className={`${FONTS.heading} text-[var(--black)] max-md:text-center`}>
            We Are Not Just a Group of Hotels
          </h2>
          <p className={`${FONTS.body} text-[var(--light-gray)] max-md:text-center`}>
            We are the people’s choice for those who seek more from their
            journey. Nestled in the heart of Lagos, our hotels redefine
            hospitality, offering a symphony of comfort, luxury, and unmatched
            service.
          </p>
        </div>
        <Button href="/about" borderColor="var(--text-color)"><p className="text-[1.2rem]">Read More</p></Button>
      </div>
    </div>
  );
}
