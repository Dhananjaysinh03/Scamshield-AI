"use client";

import { useEffect, useRef } from "react";

type Props = {
  lines: string[];
  label?: string;
};

export function HoneypotTerminal({
  lines,
  label = "Honeypot sink · live",
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div
      className="flex h-48 flex-col overflow-hidden rounded-lg border border-border bg-console sm:h-56"
      role="log"
      aria-live="polite"
      aria-label="Honeypot injection terminal"
    >
      <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-danger">
        {label}
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-emerald-100/90">
        {lines.length === 0 ? (
          <p className="text-muted">Awaiting dismantle…</p>
        ) : (
          lines.map((line, i) => (
            <p key={`${i}-${line.slice(0, 28)}`} className="break-words">
              {line}
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
