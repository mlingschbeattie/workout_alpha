import { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>;
}

export function PageHeader({ title, subtitle, cta }: { title: string; subtitle?: string; cta?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {cta}
    </div>
  );
}
