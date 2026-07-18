"use client";

import type { ReactNode } from "react";

type Props = {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
};

export function UserStep({ step, title, hint, children }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-panel p-4 shadow-sm sm:p-6 dark:shadow-none">
      <header className="mb-4 flex gap-3 sm:mb-5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent"
          aria-hidden
        >
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
          {hint ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}
