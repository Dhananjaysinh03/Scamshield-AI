"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  lines: string[];
  label?: string;
};

export function HoneypotTerminal({
  lines,
  label = "Protection progress",
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (lines.length > 0) setOpen(true);
  }, [lines.length]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, open]);

  if (!lines.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-console">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between border-b border-white/10 px-3 py-2 text-left text-xs font-semibold text-danger"
      >
        <span>{label}</span>
        <span className="font-normal text-zinc-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div
          className="flex h-40 flex-col sm:h-48"
          role="log"
          aria-live="polite"
          aria-label="Protection progress"
        >
          <div className="flex-1 space-y-1.5 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-console-fg">
            {lines.map((line, i) => (
              <p key={`${i}-${line.slice(0, 28)}`} className="break-words">
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
