import Button from "../shared/Button";
import FONTS from "@/utils/fonts";

import miniabout from "@/assets/home/mini-about.jpg";

export default function MiniAbout() {
  return (
    <div className="w-full p-[12rem] flex">
      <img
        src={miniabout.src}
        alt="Image about Five Clover Hotel"
        className="w-[40%] aspect-square object-cover"
      />
      <div className="flex flex-col justify-between gap-[4.8rem] w-[60%] bg-[var(--accent-2)] p-[12rem]">
        <div className="flex flex-col gap-[1.8rem]">
          <h1 className={`${FONTS.heading} text-[var(--black)]`}>
            We Are Not Just a Group of Hotels
          </h1>
          <p className={`${FONTS.body} text-[var(--light-gray)]`}>
            We are the people’s choice for those who seek more from their
            journey. Nestled in the heart of Lagos, our hotels redefine
            hospitality, offering a symphony of comfort, luxury, and unmatched
            service.
          </p>
        </div>
        <Button href="" borderColor="var(--black)"><p className="text-[1.2rem] text-[var(--black)]">Read More</p></Button>
      </div>
    </div>
  );
}
