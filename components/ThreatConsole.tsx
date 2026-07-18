"use client";

import { useEffect, useRef, useState } from "react";

export function ThreatConsole({ lines }: { lines: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, open]);

  if (!lines.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span>Technical activity log</span>
        <span className="text-muted">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div
          className="flex h-56 flex-col overflow-hidden border-t border-border bg-console sm:h-64"
          role="log"
          aria-live="polite"
          aria-label="Activity log"
        >
          <div className="flex-1 space-y-1.5 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-console-fg">
            {lines.map((line, i) => (
              <p key={`${i}-${line.slice(0, 24)}`} className="break-words">
                {line}
              </p>
            ))}
            <div ref={endRef} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
