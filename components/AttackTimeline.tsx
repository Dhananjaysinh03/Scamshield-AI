"use client";

import { useState } from "react";
import { StageDetail } from "@/components/StageDetail";
import type { EvidenceItem, TimelineResult, TimelineStage } from "@/lib/types";

type Props = {
  result: TimelineResult | null;
  evidence: EvidenceItem[];
  loading?: boolean;
  error?: string | null;
};

export function AttackTimeline({ result, evidence, loading, error }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const stages = result?.stages ?? [];
  const active: TimelineStage | null =
    stages.find((s) => s.id === activeId) ?? stages[0] ?? null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-panel/40 px-4 py-6">
        <p className="font-mono text-xs text-accent">
          [Timeline]: Stitching psychological stages…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-4">
        <p className="font-mono text-xs text-danger">[Timeline]: {error}</p>
      </div>
    );
  }

  if (!result || stages.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-panel/30 px-4 py-5">
        <p className="text-sm text-muted">
          Attack timeline empty — add evidence and build a timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-accent">
          Attack timeline
        </h2>
        <span className="font-mono text-[10px] text-muted">
          {stages.length} stages
        </span>
      </div>

      {result.narrative ? (
        <p className="text-sm leading-relaxed text-foreground/80">
          {result.narrative}
        </p>
      ) : null}

      {/* Mobile: horizontal scroll · Desktop: vertical rail */}
      <div className="relative min-w-0">
        <ol className="chip-rail sm:flex-col sm:overflow-visible sm:pb-0">
          {stages.map((stage, i) => {
            const selected = active?.id === stage.id;
            return (
              <li
                key={stage.id}
                className="timeline-stage-in w-[min(85vw,14rem)] shrink-0 sm:w-auto sm:min-w-0"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(stage.id)}
                  onMouseEnter={() => setActiveId(stage.id)}
                  className={`group flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] ${
                    selected
                      ? "border-accent bg-accent/10 stage-glow"
                      : "border-border bg-panel/40 hover:border-accent/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      selected
                        ? "bg-accent text-zinc-950"
                        : "bg-border/80 text-muted group-hover:text-foreground"
                    }`}
                    aria-hidden
                  >
                    {stage.order}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-semibold text-foreground">
                      {stage.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-muted">
                      {new Date(stage.timestamp).toLocaleTimeString()} ·{" "}
                      {Math.round(stage.confidence * 100)}%
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <StageDetail stage={active} evidence={evidence} />
    </div>
  );
}
