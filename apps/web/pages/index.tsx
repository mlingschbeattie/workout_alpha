import Link from "next/link";
import { Section, SectionHeader } from "../components/Section";

export default function Home() {
  return (
    <>
      {/* Hero (bold, full-bleed, black bg, white text, red CTA) */}
      <section className="relative bg-[var(--ua-black)] text-white">
        <div className="ua-container py-12 sm:py-16">
          <div className="grid items-center gap-8 sm:grid-cols-2">
            <div>
              <h1 className="text-hero font-semibold">
                Explosive Power.  
                <span className="text-[var(--ua-red)]">DT</span> Ready.
              </h1>
              <p className="mt-3 text-white/80">
                Build separation power and first-step violence. Plan, track, and analyze performance—built for athletes and coaches.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/plans" className="ua-btn ua-btn-dark">Create a Plan</Link>
                <Link href="/logs" className="ua-btn ua-btn-primary">Log Today</Link>
              </div>
            </div>

            {/* Hero image placeholder (replace with your action shot) */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[url('/hero.jpg')] bg-cover bg-center">
              {/* fallback overlay if no image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Confidence band (UA vibe: stark, compact) */}
      <section className="border-b border-t border-black/10 bg-white">
        <div className="ua-container py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-black/70">
            <span>Mobile-first</span>
            <span>Power + Strength + Plyo</span>
            <span>Coach-friendly reports</span>
            <span>SQLite / Prisma (local dev)</span>
          </div>
        </div>
      </section>

      {/* Feature grid (white cards) */}
      <Section>
        <SectionHeader title="What you can do" />
        <div className="ua-container grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Exercise Library",
              text: "Create & categorize strength, power, and plyo work.",
              href: "/exercises",
            },
            {
              title: "Plan Builder",
              text: "Design multi-week blocks with day-by-day sessions.",
              href: "/plans",
            },
            {
              title: "Quick Logging",
              text: "Log sets fast—prefill from your assigned plan.",
              href: "/logs",
            },
            {
              title: "Reports",
              text: "Weekly volume, group by user/exercise, CSV export.",
              href: "/reports",
            },
            {
              title: "Coach Mode",
              text: "Assign plans to athletes; measure compliance.",
              href: "/plans",
            },
            {
              title: "Mobile Friendly",
              text: "Everything responsive in a thumb-friendly layout.",
              href: "/",
            },
          ].map((f) => (
            <Link key={f.title} href={f.href} className="ua-card block p-5 hover:shadow-lg transition-shadow">
              <div className="mb-2 h-8 w-8 rounded-md bg-[var(--ua-red)]" />
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-black/70">{f.text}</p>
              <div className="mt-3 text-[var(--ua-red)]">Learn more →</div>
            </Link>
          ))}
        </div>
      </Section>

      {/* CTA band (black → white text, big CTA) */}
      <section className="bg-[var(--ua-black)] py-12 text-white">
        <div className="ua-container flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Ready to train like a disruptor?</h2>
            <p className="text-white/80">Assign a plan and log today’s work. Own the trenches.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/reports" className="ua-btn ua-btn-dark">View Reports</Link>
            <Link href="/logs" className="ua-btn ua-btn-primary">Start Logging</Link>
          </div>
        </div>
      </section>
    </>
  );
}

