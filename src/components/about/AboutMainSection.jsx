import About1 from "@/assets/about/about-1.jpg";
import About2 from "@/assets/about/about-2.jpg";

export default function AboutMainSection() {
  return (
    <>
      <div
        data-component="AboutMainSection"
        className="p-[12rem] pt-[18rem] max-md:px-[6rem] max-sm:px-[2rem] w-full flex flex-col gap-[4.8rem]"
      >
        <div
          data-component="Block1"
          className="bg-[color:var(--text-color)] p-[6rem] flex flex-col gap-[1.8rem] text-[var(--white)] font-secondary"
        >
          <h1 className="text-6xl font-secondary font-bold">
            We Always Care About Your Experience
          </h1>
          <p className="text-2xl">
            Welcome to Five Clover Hotels, a group of hotels where we redefine
            hospitality with a touch of elegance and unparalleled service. As a
            premier hotel brand with several distinguished branches across
            Lagos, we are dedicated to offering our guests a unique blend of
            luxury, comfort and convenience. Each of our hotels is designed to
            provide an exceptional experience, whether you are visiting for
            business or leisure.
          </p>
        </div>
        <div data-component="Block2" className="flex flex-col w-full">
          <div className="flex max-sm:flex-col">
            <div
              data-component="Block2Image"
              className="w-[60%] max-sm:w-[100%] max-w-[40rem] max-sm:max-w-[100%] max-sm:h-[25rem]"
            >
              <img
                src={About1.src}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div
              data-component="Block2Text"
              className="flex flex-col gap-[1.8rem] font-secondary bg-[color:var(--accent-2)] w-[100%] p-[12rem] max-md:p-[6rem] max-sm:p-[2rem]"
            >
              <h1 className="text-6xl font-bold">Luxury and Comfort</h1>
              <p className="text-2xl">
                Five Clover Hotels, the top choice for luxury and relaxation in
                Lagos, boasts several branches, each offering a distinctive
                combination of luxury, comfort, and convenience for both
                business and leisure travelers. Our primary aim is to deliver an
                exceptional African experience, providing over 200 exquisite
                suites crafted with your comfort as the top priority. Our
                devoted team is dedicated to fulfilling all your requirements,
                whether it's relishing the flavors of African cuisine, unwinding
                at our exclusive bars and lounges or utilizing our
                state-of-the-art conference facilities.
              </p>
            </div>
          </div>
          {/* Second row - you can add this structure for additional img+text pairs */}
          <div className="flex max-sm:flex-col">
            <div
              data-component="Block2Text"
              className="flex flex-col gap-[1.8rem] font-secondary bg-[color:var(--accent-2)] w-[100%] p-[12rem] max-md:p-[6rem] max-sm:p-[2rem]"
            >
              <h1 className="text-6xl font-bold">
                Experience African Hospitality
              </h1>
              <p className="text-2xl">
                Embark on a gastronomic journey with our menu inspired by the
                diverse landscapes of Africa, and immerse yourself in our lively
                atmosphere where traditional recipes merge with modern culinary
                techniques, resulting in an extraordinary dining experience.
                Explore our several conveniently located branches, each
                providing a variety of personalized experiences tailored to your
                preferences. Whether you seek a lively atmosphere, luxurious
                comfort, or a serene and peaceful setting, Five Clover Group of
                Hotels have you covered. We are excited to welcome you to an
                exceptional journey, offering the perfect blend of luxury,
                comfort, design, style, and tranquility at an affordable price.
              </p>
            </div>
            <div
              data-component="Block2Image"
              className="w-[60%] max-w-[40rem] max-sm:w-[100%] max-sm:max-w-[100%] max-sm:h-[25rem]"
            >
              <img
                src={About2.src}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
        <div
          data-component="Block3"
          className="bg-[color:var(--text-color)] p-[6rem] flex max-sm:flex-col gap-[6rem] text-[var(--white)] font-secondary"
        >
          <div className="flex flex-col gap-[1.8rem]">
            <h1 className="text-6xl font-secondary font-bold">Our Vision</h1>
            <p className="text-2xl">
              To be an organically developed global hotel management company
              that excels in its core components of place, service,
              people and system.
            </p>
          </div>
          <div className="flex flex-col gap-[1.8rem]">
            <h1 className="text-6xl font-secondary font-bold">Our Mission</h1>
            <p className="text-2xl">
              Our mission is to be the most hospitable company in the world by
              creating world-class experiences for guests.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
