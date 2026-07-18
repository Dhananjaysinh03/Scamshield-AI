"use client";

import type { ScanResult } from "@/lib/types";

const LEVEL_COLOR: Record<ScanResult["riskLevel"], string> = {
  low: "text-accent",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-danger",
};

export function ScanResults({ result }: { result: ScanResult | null }) {
  if (!result) return null;

  return (
    <div className="rounded-lg border border-border bg-panel/60 p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className={`font-display text-2xl font-bold uppercase ${LEVEL_COLOR[result.riskLevel]}`}
        >
          {result.riskLevel}
        </span>
        <span className="font-mono text-sm text-muted">
          score {result.score}/100
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground/90">{result.summary}</p>
      {result.urls.length > 0 ? (
        <ul className="mt-3 space-y-1 font-mono text-xs text-accent/90">
          {result.urls.map((u) => (
            <li key={u} className="break-all">
              {u}
            </li>
          ))}
        </ul>
      ) : null}
      {result.signals.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-muted">
          {result.signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
