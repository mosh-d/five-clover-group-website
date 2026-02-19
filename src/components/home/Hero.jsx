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
      <div className="flex flex-col gap-[1rem] px-[12rem] py-[18rem] h-full items-center justify-around">
        <div className="flex flex-col gap-[2.4rem] items-center justify-center">
          <h1 className="text-[var(--white)] font-secondary text-[3.4rem] text-center">
            Experience The Art of Hospitality—Multiplied
          </h1>
          <p className="font-secondary text-[var(--white)] text-[2rem] text-center">
            Welcome to Five Clover Hotels, the premier hotel management company
            behind three distinct brands: Five Clover Hotels, Caritas Inns, and
            RingRuby Hotels. Together, our 2 Five Clover properties, 4 Caritas
            locations, and 3 RingRuby curated experiences across Lagos deliver a
            unified promise of elegance, comfort, and personalized service—each
            with its own unique character.
          </p>
        </div>
      </div>
    </div>
  );
}
