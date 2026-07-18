"use client";

import type { EvidenceItem, TimelineStage } from "@/lib/types";

type Props = {
  stage: TimelineStage | null;
  evidence: EvidenceItem[];
};

export function StageDetail({ stage, evidence }: Props) {
  if (!stage) {
    return (
      <div className="rounded-xl border border-border bg-panel-soft px-4 py-5">
        <p className="text-sm text-muted">
          Tap a step above to see what happened.
        </p>
      </div>
    );
  }

  const linked = evidence.filter((e) => stage.evidenceIds.includes(e.id));

  return (
    <div
      className="stage-detail-in rounded-xl border border-accent/25 bg-accent-soft/50 px-4 py-4"
      key={stage.id}
    >
      <h4 className="font-display text-lg font-bold text-accent">{stage.label}</h4>
      <p className="mt-2 text-base leading-relaxed text-foreground/90">
        {stage.rationale}
      </p>
      {linked.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">From your message</p>
          <ul className="mt-2 space-y-2">
            {linked.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-panel px-3 py-2.5 text-sm leading-relaxed text-foreground/85"
              >
                <span className="line-clamp-4 whitespace-pre-wrap">
                  {item.content}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
