"use client";

import { useEffect, useRef } from "react";

export function ThreatConsole({ lines }: { lines: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div
      className="flex h-64 flex-col overflow-hidden rounded-lg border border-border bg-console sm:h-72"
      role="log"
      aria-live="polite"
      aria-label="Threat intelligence console"
    >
      <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-accent">
        Security console · live
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-emerald-100/90">
        {lines.length === 0 ? (
          <p className="text-muted">Awaiting scan…</p>
        ) : (
          lines.map((line, i) => (
            <p key={`${i}-${line.slice(0, 24)}`} className="break-words">
              {line}
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
