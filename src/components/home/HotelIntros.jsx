import Carousel from "@/components/shared/Carousel";

export default function HotelIntros() {
  return (
    <div className="py-[12rem] gap-[24rem] flex flex-col w-full">
      <h2>Hotel Intros</h2>
      <div className="flex items-stretch w-full">
        <Carousel brand="FIVECLOVER_IMAGES" />
        <div className="flex items-center w-[40%] px-[12rem] bg-amber-400">
          <p>Five Clover Text</p>
        </div>
      </div>
    </div>
  );
}
