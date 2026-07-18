"use client";

import type { EvidenceItem, TimelineStage } from "@/lib/types";

type Props = {
  stage: TimelineStage | null;
  evidence: EvidenceItem[];
};

export function StageDetail({ stage, evidence }: Props) {
  if (!stage) {
    return (
      <p className="text-sm text-muted">
        Select a stage to inspect rationale and linked evidence.
      </p>
    );
  }

  const linked = evidence.filter((e) => stage.evidenceIds.includes(e.id));

  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-lg font-bold text-accent">{stage.label}</p>
        <p className="mt-1 font-mono text-xs text-muted">
          confidence {(stage.confidence * 100).toFixed(0)}% · order {stage.order}
        </p>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{stage.rationale}</p>
      <div className="space-y-2">
        {linked.map((e) => (
          <p
            key={e.id}
            className="line-clamp-4 rounded-md border border-border bg-console/80 px-3 py-2 text-xs text-muted"
          >
            {e.content}
          </p>
        ))}
      </div>
    </div>
  );
}
