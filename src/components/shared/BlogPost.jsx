"use client";

import { useState } from "react";
import Link from "next/link";
import FONTS from "@/utils/fonts";
import { BsChevronDoubleRight } from "react-icons/bs";

export default function BlogPost({ image, title, content, slug }) {
  const [textOpen, setTextOpen] = useState(false);

  const handleClick = () => {
    setTextOpen((textOpen) => !textOpen);
  };

  return (
    <div className="flex flex-col items-start w-full">
      <div
        className="w-full h-[45rem] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <div className="flex flex-col px-[2.4rem] md:px-[1.2rem] gap-[2.4rem]">
        <h1 className={`${FONTS.heading}`}>
          {title}
        </h1>
        <div className={textOpen ? "" : "line-clamp-2"}>
          <p className="font-secondary tracking-[.01em] font-bold text-[1.8rem] text-justify">
            {content}
          </p>
        </div>
      </div>
      <div className="flex w-full justify-between md:flex-col">
        <button
          onClick={handleClick}
          className="flex items-center gap-[.5rem] m-[2.4rem] md:m-[1rem] transition-transform duration-100 ease-in hover:scale-105 active:scale-95"
        >
          <span className="text-[1.6rem] font-normal">{textOpen ? "Read less" : "Read more"}</span>
        </button>
        <Link href={`/blog/${slug}`}>
          <button className="flex items-center gap-[.5rem] m-[2.4rem] md:m-[1rem] transition-transform duration-100 ease-in hover:scale-105 active:scale-95">
            <span className="text-[1.6rem] font-normal">View Full Blog</span>
            <BsChevronDoubleRight size="2rem" className="pb-[.5rem]" />
          </button>
        </Link>
      </div>
    </div>
  );
}
