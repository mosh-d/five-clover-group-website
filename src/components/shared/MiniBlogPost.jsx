export default function MiniBlogPost({
  onSelect,
  href,
  image,
  title,
  caption,
}) {
  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
    if (href) {
      // Smooth scroll to the target element
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col gap-[1.8rem] w-[40%] max-sm:w-[28rem] flex-shrink-0 relative transition-all duration-300 ease-in-out hover:cursor-pointer hover:bg-[var(--text-color)] active:bg-[var(--black)] group"
    >
      <div className="w-full h-[25rem] overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-col px-[2.4rem] max-sm:px-0 md:px-[1.2rem] gap-[1.8rem]">
        <div className="line-clamp-2">
          <h2 className="font-bold font-secondary text-[3.4rem] max-sm:text-[2rem] text-[var(--black)] group-hover:text-[var(--white)] group-active:text-[var(--white)]">
            {title}
          </h2>
        </div>
        <div className="line-clamp-2">
          <p className="font-secondary font-bold text-[1.8rem] max-sm:text-[1.4rem] tracking-[.01em] text-[var(--text-color)] group-hover:text-[var(--white)] group-active:text-[var(--white)]">
            {caption}
          </p>
        </div>
      </div>
    </div>
  );
}
