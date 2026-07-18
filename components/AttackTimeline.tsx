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
      <div className="rounded-2xl border border-border bg-panel-soft px-4 py-6">
        <p className="text-sm text-muted">Mapping how they tried to pressure you…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/40 bg-danger-soft px-4 py-4">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!result || stages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
          How they tried to trick you
        </h3>
        {result.narrative ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-base">
            {result.narrative}
          </p>
        ) : null}
      </div>

      <ol className="chip-rail sm:flex-col sm:overflow-visible sm:pb-0">
        {stages.map((stage, i) => {
          const selected = active?.id === stage.id;
          return (
            <li
              key={stage.id}
              className="timeline-stage-in w-[min(85vw,15rem)] shrink-0 sm:w-auto"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <button
                type="button"
                onClick={() => setActiveId(stage.id)}
                className={`flex min-h-12 w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selected
                    ? "border-accent bg-accent-soft stage-glow"
                    : "border-border bg-panel hover:border-accent/40"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    selected
                      ? "bg-accent text-white dark:text-zinc-950"
                      : "bg-panel-soft text-muted"
                  }`}
                  aria-hidden
                >
                  {stage.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground sm:text-base">
                    {stage.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Tap to read why · {Math.round(stage.confidence * 100)}% match
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <StageDetail stage={active} evidence={evidence} />
    </div>
  );
}
