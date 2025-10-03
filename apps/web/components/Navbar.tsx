import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const nav = [
    { href: "/", label: "Home" },
    { href: "/exercises", label: "Exercises" },
    { href: "/plans", label: "Plans" },
    { href: "/logs", label: "Logs" },
    { href: "/reports", label: "Reports" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-brand" />
            <span className="font-semibold">DT Explosive</span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className="text-sm text-gray-700 hover:text-brand">
                {n.label}
              </Link>
            ))}
            <a
              href="https://github.com/mlingschbeattie/workout_alpha"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              GitHub
            </a>
          </nav>
          <button
            className="md:hidden rounded-lg p-2 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle Menu"
          >
            <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {open && (
          <div className="md:hidden pb-3">
            <nav className="grid gap-1">
              {nav.map(n => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-2 py-2 text-sm hover:bg-gray-50">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
