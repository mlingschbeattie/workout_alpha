import React from "react";

interface FormWrapperProps {
  title?: string;
  description?: string;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function FormWrapper({
  title,
  description,
  onSubmit,
  className = "",
  children,
  footer,
}: FormWrapperProps) {
  return (
    <div className={`ua-card w-full max-w-2xl mx-auto p-5 ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {description && <p className="text-sm text-black/70 mt-1">{description}</p>}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        {footer && <div className="pt-2">{footer}</div>}
      </form>
    </div>
  );
}

