import Button from "./Button";
import AD1 from "../../assets/cordis-ads/CORDIS-AD-1.png";

export default function Ad() {
  return (
    <aside className="flex flex-col h-full w-full gap-[2.4rem]">
      <div className="flex flex-col bg-[var(--text-color)] h-[60%] mb-[2.4rem]">
        <div
          className="bg-cover bg-center bg-no-repeat h-[70%] w-full"
          style={{ backgroundImage: `url(${AD1.src})` }}
        ></div>
        <div className="flex flex-col h-fit py-[4.8rem] px-[0.8rem] gap-[2.4rem] items-center text-center">
          <p className="text-[var(--white)] text-[1.8rem] font-normal">
            Sun, Swim, Repeat: The Ultimate Cordis Poolside Guide
          </p>
          <Button href="/">
            <p className="font-normal">CTA</p>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-[2.4rem] h-[40%] min-h-[30rem] relative after:content-[''] after:w-full after:h-full after:absolute after:top-0 after:left-0 after:bg-gradient-to-b after:from-transparent after:from-70% after:to-[var(--emphasis)] after:pointer-events-none">
        <h2 className="text-[1.6rem] text-[var(--black)] font-bold">
          Sun, Swim, Repeat: The Ultimate Cordis Poolside Guide
        </h2>
        <div className="flex flex-col gap-[2.4rem] flex-1 h-[50rem] overflow-auto px-[2rem] min-h-0 max-h-[50vh] scrollbar-thin scrollbar-thumb-[var(--black)] scrollbar-track-[var(--light-gray)] hover:scrollbar-thumb-[var(--text-color)] active:scrollbar-thumb-[var(--emphasis)]">
          <p className="font-secondary font-bold text-[2rem] tracking-[.05em]">
            Whether you&apos;re here to work or play, Cordis Splash has
            everything you need for the perfect day by the water:
          </p>
          <ul className="flex flex-col gap-[1rem] list-[circle] mb-[8rem]">
            <li>
              <p className="font-secondary font-normal text-[1.8rem] tracking-[.05em] text-justify">
                Sunrise Swim: Beat the heat and the crowds with a tranquil
                morning laps session in our Infinity Pool.
              </p>
            </li>
            <li>
              <p className="font-secondary font-normal text-[1.8rem] tracking-[.05em] text-justify">
                Aqua Fitness Flow: Join our certified instructor for a
                low-impact water aerobics class—strengthen core muscles while
                splashing to upbeat tunes.
              </p>
            </li>
            <li>
              <p className="font-secondary font-normal text-[1.8rem] tracking-[.05em] text-justify">
                Poolside Brunch: Order from the Splash menu—think avocado toast
                topped with dukkah or chilled ginger-lime mocktails—delivered
                right to your cabana.
              </p>
            </li>
            <li>
              <p className="font-secondary font-normal text-[1.8rem] tracking-[.05em] text-justify">
                Sunset Lounging: Recline on our teak loungers as the sky turns
                orange and the city skyline sparkles.
              </p>
            </li>
            <li>
              <p className="font-secondary font-normal text-[1.8rem] tracking-[.05em] text-justify">
                Starlit Night Dip: Cap your evening with our signature Night
                Swim, where soft under-water lights create a dreamy glow.
              </p>
            </li>
            <li>
              <p className="font-secondary font-normal text-[1.8rem] tracking-[.05em] text-justify">
                Tip: reserve a Splash Cabana in advance for extra shade,
                privacy, and dedicated server service. With these rituals in
                hand, your days at Cordis Splash will become the highlight of
                any Lagos itinerary.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
