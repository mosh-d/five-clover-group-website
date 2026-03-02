import FiveClover from "@/assets/home/hero/five-clover.jpg";

import FiveCloverLogo from "@/assets/home/hero/logos/five-clover-logo.png";
import CaritasLogo from "@/assets/home/hero/logos/caritas-logo.png";
import RingRubyLogo from "@/assets/home/hero/logos/ring-ruby-logo.png";
import CordisLogo from "@/assets/home/hero/logos/cordis-logo.png";

const LOGOS = [
    {
        name: "Five Clover",
        logo: FiveCloverLogo,
    },
    {
        name: "Caritas",
        logo: CaritasLogo,
    },
    {
        name: "RingRuby",
        logo: RingRubyLogo,
    },
    {
        name: "Cordis",
        logo: CordisLogo,
    },
]

export default function Hero() {
  return (
    <div
      className="bg-cover bg-center h-[100vh] min-h-[80rem] w-full flex flex-col justify-center items-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, .95), rgba(0, 0, 0, .6)), url(${FiveClover.src})`,
      }}
    >
      <div className="flex flex-col gap-[1rem] px-[12rem] py-[18rem] max-md:px-[6rem] max-sm:px-[2rem] h-full items-center justify-around">
        <div className="flex flex-col gap-[2.4rem] items-center justify-center">
          <h1 className="text-[var(--white)] font-secondary text-[3.4rem] text-center">
            Experience The Art of Hospitality—Multiplied
          </h1>
          <p className="font-secondary text-[var(--white)] text-[1.8rem] text-center">
            Welcome to Five Clover Hotels, the premier hotel management company
            behind four distinct brands: Five Clover Hotels, Caritas Inns,
            RingRuby Hotels, and The Cordis Hotels. Together, our 3 Five Clover properties, 4 Caritas
            locations, 4 RingRuby Hotels, and 1 Cordis Hotel curated experiences across Lagos deliver a
            unified promise of elegance, comfort, and personalized service—each
            with its own unique character.
          </p>
        </div>
      </div>
    </div>
  );
}
