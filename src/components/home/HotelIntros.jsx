import Carousel from "@/components/shared/Carousel";
import FONTS from "@/utils/fonts";
import UnderlinedButton from "@/components/shared/UnderlinedButton";

export default function HotelIntros() {
  return (
    <div className="py-[12rem] gap-[24rem] flex flex-col w-full">
      <div className="flex items-stretch w-full">
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

      <div className="flex items-stretch w-full">
        <div className="flex flex-col gap-[4.8rem] justify-center items-start w-[35%] px-[12rem]">
          <div className="flex flex-col gap-[1.8rem]">
            <h3 className={`${FONTS.context}`}>RingRuby Hotels</h3>
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

      <div className="flex items-stretch w-full">
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

      <div className="flex items-stretch w-full">
        <div className="flex flex-col gap-[4.8rem] justify-center items-start w-[35%] px-[12rem]">
          <div className="flex flex-col gap-[1.8rem]">
            <h3 className={`${FONTS.context}`}>Cordis Hotels</h3>
            <h4 className={`${FONTS.heading}`}>Our 4-star king in Ikeja</h4>
            <p className={`${FONTS.body}`}>
              Cordis Hotels—where every stay is a journey of comfort and
              sophistication, offering a unique blend of elegance and
              modern convenience.
            </p>
          </div>
          <UnderlinedButton>Reserve</UnderlinedButton>
        </div>
        <Carousel brand="CORDIS_IMAGES" />
      </div>
    </div>
  );
}
