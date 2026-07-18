"use client";

import { useState } from "react";
import { StageDetail } from "@/components/StageDetail";
import type { EvidenceItem, TimelineResult, TimelineStage } from "@/lib/types";

type Props = {
  timeline: TimelineResult | null;
  evidence: EvidenceItem[];
  loading?: boolean;
};

export function AttackTimeline({ timeline, evidence, loading }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const stages = timeline?.stages ?? [];
  const active: TimelineStage | null =
    stages.find((s) => s.id === activeId) ?? stages[0] ?? null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-panel/50 p-4">
        <p className="font-mono text-xs text-accent">[Timeline]: Building funnel…</p>
      </div>
    );
  }

  if (!timeline || stages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-panel/30 p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Attack timeline
        </p>
        <p className="mt-2 text-sm text-muted">
          Add drops and build timeline to stitch psychological stages.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-panel/50 p-4 sm:p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        Attack timeline
      </p>
      <p className="mt-2 text-sm text-foreground/90">{timeline.narrative}</p>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 sm:block sm:overflow-visible sm:pb-0">
        <ol className="flex min-w-max gap-3 sm:min-w-0 sm:flex-col sm:gap-0">
          {stages.map((stage, i) => {
            const isActive = active?.id === stage.id;
            return (
              <li
                key={stage.id}
                className="timeline-stage relative flex sm:gap-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(stage.id)}
                  className={`flex min-h-11 min-w-[9.5rem] flex-col rounded-lg border px-3 py-3 text-left transition sm:min-w-0 sm:flex-1 sm:flex-row sm:items-center sm:gap-3 ${
                    isActive
                      ? "border-accent bg-accent/10 shadow-[0_0_24px_rgba(52,211,153,0.15)]"
                      : "border-border bg-console/40 hover:border-accent/40"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                >
                  <span
                    className={`mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs sm:mb-0 ${
                      isActive
                        ? "bg-accent text-zinc-950"
                        : "bg-border text-muted"
                    }`}
                  >
                    {stage.order}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {stage.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-muted">
                      {(stage.confidence * 100).toFixed(0)}% conf
                    </span>
                  </span>
                </button>
                {i < stages.length - 1 ? (
                  <div
                    className="pointer-events-none absolute bottom-0 left-1/2 hidden h-4 w-px -translate-x-1/2 translate-y-full bg-border sm:block"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <StageDetail stage={active} evidence={evidence} />
      </div>
    </div>
  );
}
