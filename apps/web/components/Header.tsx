import Link from "next/link";
import { useEffect, useState } from "react";

const nav = [
  { href: "/exercises", label: "Exercises" },
  { href: "/plans", label: "Plans" },
  { href: "/logs", label: "Logs" },
  { href: "/reports", label: "Reports" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`ua-header sticky top-0 z-50 bg-white ${scrolled ? "is-scrolled" : ""}`}>
      <div className="ua-container h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Under Armour-esque minimal block as logo placeholder */}
          <div className="h-7 w-7 rounded-md bg-black" />
          <span className="text-[15px] font-semibold tracking-wide">DT Explosive</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className="text-[15px] font-medium text-black hover:text-[var(--ua-red)]">
              {n.label}
            </Link>
          ))}
          <a
            href="https://github.com/mlingschbeattie/workout_alpha"
            target="_blank"
            rel="noreferrer"
            className="ua-btn ua-btn-ghost"
          >
            GitHub
          </a>
        </nav>

        {/* Mobile */}
        <button
          className="md:hidden rounded-lg p-2 hover:bg-black/5"
          onClick={() => setOpen(!open)}
          aria-label="Toggle Menu"
        >
          <svg className="h-6 w-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              d={open ? "M6 18L18 6M6 6l12 12" : "M3 6h18M3 12h18M3 18h18"} />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-black/10 md:hidden">
          <nav className="ua-container grid gap-1 py-2">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className="rounded-lg px-2 py-2 text-sm hover:bg-black/5">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

