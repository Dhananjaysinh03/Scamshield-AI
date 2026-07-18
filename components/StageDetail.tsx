"use client";

import type { EvidenceItem, TimelineStage } from "@/lib/types";

type Props = {
  stage: TimelineStage | null;
  evidence: EvidenceItem[];
};

export function StageDetail({ stage, evidence }: Props) {
  if (!stage) {
    return (
      <div className="rounded-lg border border-border bg-panel/40 px-4 py-5">
        <p className="text-sm text-muted">
          Select a stage to inspect rationale and linked evidence.
        </p>
      </div>
    );
  }

  const linked = evidence.filter((e) => stage.evidenceIds.includes(e.id));

  return (
    <div
      className="rounded-lg border border-accent/30 bg-panel/60 px-4 py-4 stage-detail-in"
      key={stage.id}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="font-display text-lg font-bold text-accent">
          {stage.label}
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          confidence {Math.round(stage.confidence * 100)}%
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">
        {stage.rationale}
      </p>
      <div className="mt-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Linked evidence
        </p>
        {linked.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            No matching drops in session (mock IDs may be placeholders).
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {linked.map((item) => (
              <li
                key={item.id}
                className="rounded border border-border/80 bg-console/80 px-3 py-2 font-mono text-xs leading-relaxed text-emerald-100/85"
              >
                <span className="line-clamp-4 whitespace-pre-wrap">
                  {item.content}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
