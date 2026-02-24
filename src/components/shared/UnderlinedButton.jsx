export default function UnderlinedButton({ children }) {
  return (
    <button className="font-medium p-[1rem] pb-[.5rem] px-[2rem] text-[var(--emphasis)] text-[1.8rem] border-b border-[var(--emphasis)] cursor-pointer hover:bg-[var(--emphasis)] hover:text-white hover:shadow-xl transition-all duration-300">
      {children}
    </button>
  );
}
