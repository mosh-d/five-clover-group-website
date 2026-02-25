export default function UnderlinedButton({ children }) {
  return (
    <button className="font-medium p-[1rem] pb-[.5rem] px-[2rem] text-[var(--emphasis)] text-[1.8rem] border-b border-[var(--emphasis)] cursor-pointer hover:bg-[var(--emphasis)] hover:text-white hover:shadow-xl active:bg-[var(--emphasis)] active:text-white active:shadow-none active:scale-90 transition-all duration-300">
      {children}
    </button>
  );
}
