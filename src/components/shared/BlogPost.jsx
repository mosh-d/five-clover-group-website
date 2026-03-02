import Link from "next/link";
import FONTS from "@/utils/fonts";
import { LuExternalLink } from "react-icons/lu";

export default function BlogPost({ image, title, content, slug }) {
  return (
    <article className="flex flex-col gap-[1.8rem] items-start w-full">
      <img
        src={image}
        alt={title}
        className="w-full h-[65rem] max-sm:h-[40rem] object-cover"
      />
      <div className="flex flex-col items-start px-[2.4rem] max-md:px-[1.2rem] gap-[2.4rem]">
        <h2 className={`${FONTS.heading}`}>{title}</h2>
        <div>
          <p className="font-secondary tracking-[.01em] text-[1.8rem] text-justify">
            {content}
          </p>
        </div>
      </div>
      <div className="flex w-full justify-start px-[2.4rem] max-md:px-[1.2rem]">
        <Link href={`/blog/${slug}`}>
          <button className="flex items-center gap-[.5rem] hover:gap-[1rem] active:gap-[.5rem] transition-all duration-100 ease-in hover:cursor-pointer">
            <span className="text-[1.6rem] hover:font-bold">Read more</span>
            <LuExternalLink size="2.5rem" className="pb-[.5rem]" />
          </button>
        </Link>
      </div>
    </article>
  );
}
