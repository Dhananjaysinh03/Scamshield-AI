"use client";

import type { EvidenceItem } from "@/lib/types";

export function EvidenceList({ items }: { items: EvidenceItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">
        Messages you added ({items.length})
      </p>
      <ol className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-panel-soft px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2 text-sm text-muted">
              <span className="font-medium text-foreground">
                Message {idx + 1}
              </span>
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleTimeString()}
              </time>
            </div>
            {item.filename ? (
              <p className="mt-1 text-xs text-muted">{item.filename}</p>
            ) : null}
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {item.content}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
