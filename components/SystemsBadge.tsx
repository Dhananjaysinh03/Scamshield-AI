"use client";

const SYSTEMS = [
  {
    id: "A",
    name: "Reverse Poison",
    detail: "Honeypot flood",
  },
  {
    id: "B",
    name: "Attack Timeline",
    detail: "Psych funnel",
  },
  {
    id: "C",
    name: "Exa Forensics",
    detail: "Live web intel",
  },
] as const;

export function SystemsBadge() {
  return (
    <div className="chip-rail -mx-0.5 px-0.5" aria-label="Defense systems">
      {SYSTEMS.map((s) => (
        <div
          key={s.id}
          className="min-w-[8.75rem] max-w-[11rem] shrink-0 rounded-lg border border-border bg-panel px-3 py-2.5 shadow-sm dark:bg-panel/70 dark:shadow-none"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            System {s.id}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-tight text-foreground">
            {s.name}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted">{s.detail}</p>
        </div>
      ))}
    </div>
  );
}
