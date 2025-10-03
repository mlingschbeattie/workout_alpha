import { ReactNode } from "react";

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`ua-section ${className}`}>{children}</section>;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="ua-container mb-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {subtitle && <p className="text-black/70">{subtitle}</p>}
    </div>
  );
}

