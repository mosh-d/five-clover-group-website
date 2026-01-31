export default function UnderlinedButton({ children }) {
    return (
        <button className="font-medium text-[var(--emphasis)] text-[1.8rem] border-b border-[var(--emphasis)]">{children}</button>
    )
}