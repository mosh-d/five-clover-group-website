"use client";

import { useState } from "react";
import FONTS from "@/utils/fonts";

import fiveclover from "@/assets/home/reservation/fiveclover.jpg";
import ringruby from "@/assets/home/reservation/ringruby.jpg";
import caritas from "@/assets/home/reservation/caritas.jpg";
import cordis from "@/assets/home/reservation/cordis.jpg";

//Logos
import fivecloverlogo from "@/assets/home/reservation/logos/five-clover-logo.png";
import ringrubylogo from "@/assets/home/reservation/logos/ring-ruby-logo.png";
import caritaslogo from "@/assets/home/reservation/logos/caritas-logo.png";
import cordislogo from "@/assets/home/reservation/logos/cordis-logo.png";

export default function Reservation() {
  const [flippedCard, setFlippedCard] = useState(null);

  return (
    <div className="p-[12rem] flex flex-col items-center gap-[6rem]">
      <div className="flex flex-col items-center gap-[1.8rem]">
        <h1 className="font-secondary text-[5.3rem] font-bold text-center">
          Make a Reservation
        </h1>
        <p className={`${FONTS.body} text-[2.2rem] text-center`}>
          Make a selection based on your brand or location choice.
        </p>
      </div>
      <div className="flex gap-[6rem] flex-wrap w-full justify-center">
        {/* Five Clover Card */}
        <div className="flex flex-col items-center gap-[3rem]">
          <h2 className="text-[2.7rem]">Five Clover</h2>
          <div
            className="perspective-1000 h-[60rem] aspect-[9/16]"
            onMouseEnter={() => setFlippedCard("fiveclover")}
            onMouseLeave={() => setFlippedCard(null)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flippedCard === "fiveclover" ? "rotate-y-180" : ""}`}
            >
              <div
                className="absolute inset-0 backface-hidden flex items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(38, 49%, 51%, .6), hsla(38, 49%, 51%, .4)), url(${fiveclover.src})`,
                  backgroundBlendMode: "soft-light",
                }}
              ></div>
              <div
                className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(38, 49%, 10%, 1), hsla(38, 49%, 30%, 1)), url(${fiveclover.src})`,
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="w-[12rem] absolute top-0 m-auto">
                  <img src={fivecloverlogo.src} alt="" />
                </div>
                <div className="w-full px-[4rem] flex flex-col items-center">
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Monastery Road
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Abijo, GRA
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Ilupeju
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caritas Card */}
        <div className="flex flex-col items-center gap-[3rem]">
          <h2 className="text-[2.7rem]">Caritas</h2>
          <div
            className="perspective-1000 h-[60rem] aspect-[9/16]"
            onMouseEnter={() => setFlippedCard("caritas")}
            onMouseLeave={() => setFlippedCard(null)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flippedCard === "caritas" ? "rotate-y-180" : ""}`}
            >
              <div
                className="absolute inset-0 backface-hidden flex items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(24, 93%, 45%, .4), hsla(24, 93%, 45%, .4)), url(${caritas.src})`,
                  backgroundBlendMode: "soft-light",
                }}
              ></div>
              <div
                className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(24, 93%, 10%, 1), hsla(24, 93%, 30%, 1)), url(${caritas.src})`,
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="w-[12rem] absolute top-0 m-auto">
                  <img src={caritaslogo.src} alt="" />
                </div>
                <div className="w-full px-[4rem] flex flex-col items-center">
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Igbobi
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Ilasan
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Lekki, Phase 1
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Yaba
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RingRuby Card */}
        <div className="flex flex-col items-center gap-[3rem]">
          <h2 className="text-[2.7rem]">Ringruby</h2>
          <div
            className="perspective-1000 h-[60rem] aspect-[9/16]"
            onMouseEnter={() => setFlippedCard("ringruby")}
            onMouseLeave={() => setFlippedCard(null)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flippedCard === "ringruby" ? "rotate-y-180" : ""}`}
            >
              <div
                className="absolute inset-0 backface-hidden flex items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(359, 78%, 51%, .6), hsla(359, 78%, 51%, .6)), url(${ringruby.src})`,
                  backgroundBlendMode: "soft-light",
                }}
              ></div>
              <div
                className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(359, 78%, 10%, 1), hsla(359, 78%, 30%, 1)), url(${ringruby.src})`,
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="w-[12rem] absolute top-0 m-auto">
                  <img src={ringrubylogo.src} alt="" />
                </div>
                <div className="w-full px-[4rem] flex flex-col items-center">
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Sangotedo
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Eso close, ikeja GRA
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Oduduwa way, ikeja GRA
                  </a>
                  <hr className="w-full opacity-40" />
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Value County
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cordis Card */}
        <div className="flex flex-col items-center gap-[3rem]">
          <h2 className="text-[2.7rem]">Cordis</h2>
          <div
            className="perspective-1000 h-[60rem] aspect-[9/16]"
            onMouseEnter={() => setFlippedCard("cordis")}
            onMouseLeave={() => setFlippedCard(null)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flippedCard === "cordis" ? "rotate-y-180" : ""}`}
            >
              <div
                className="absolute inset-0 backface-hidden flex items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(47, 70%, 50%, .6), hsla(47, 70%, 50%, .6)), url(${cordis.src})`,
                  backgroundBlendMode: "soft-light",
                }}
              ></div>
              <div
                className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-cover text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(hsla(47, 70%, 10%, 1), hsla(47, 70%, 30%, 1)), url(${cordis.src})`,
                  backgroundBlendMode: "multiply",
                }}
              >
                <div className="w-[12rem] absolute top-0 m-auto">
                  <img src={cordislogo.src} alt="" />
                </div>
                <div className="w-full px-[4rem] flex flex-col items-center">
                  <a
                    href=""
                    className="p-[2rem] w-full text-center text-[1.2rem]"
                  >
                    Ikeja
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
