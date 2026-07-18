"use client";

const SYSTEMS = [
  {
    id: "A",
    name: "Reverse Poison",
    detail: "Honeypot credential flood",
  },
  {
    id: "B",
    name: "Attack Timeline",
    detail: "Multi-stage psych funnel",
  },
  {
    id: "C",
    name: "Exa Forensics",
    detail: "Live web threat intel",
  },
] as const;

export function SystemsBadge() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {SYSTEMS.map((s) => (
        <div
          key={s.id}
          className="min-w-[9.5rem] shrink-0 rounded-lg border border-border bg-panel/70 px-3 py-2"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            System {s.id}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{s.name}</p>
          <p className="text-[11px] text-muted">{s.detail}</p>
        </div>
      ))}
    </div>
  );
}
