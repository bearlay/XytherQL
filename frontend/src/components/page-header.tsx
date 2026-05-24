import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
}: {
  title: ReactNode;
  description?: string;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </header>
  );
}
