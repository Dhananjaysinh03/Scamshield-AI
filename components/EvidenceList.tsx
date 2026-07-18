"use client";

import type { EvidenceItem } from "@/lib/types";

export function EvidenceList({ items }: { items: EvidenceItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-panel/20 px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Evidence queue
        </p>
        <p className="mt-2 text-sm text-foreground/90">
          Hit <span className="text-accent font-semibold">▶ Pitch mode</span> for
          a full auto demo — or Load scenario / paste a drop.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item, idx) => (
        <li
          key={item.id}
          className="rounded-lg border border-border bg-panel/50 px-3 py-3"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span className="font-mono uppercase tracking-wider text-accent">
              Drop {idx + 1} · {item.type}
            </span>
            <time dateTime={item.createdAt}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </time>
          </div>
          {item.filename ? (
            <p className="mt-1 text-xs text-muted">{item.filename}</p>
          ) : null}
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
            {item.content}
          </p>
        </li>
      ))}
    </ol>
  );
}
