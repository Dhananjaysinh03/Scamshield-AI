"use client";

type Props = {
  profiles: string[];
};

export function ProfileTicker({ profiles }: Props) {
  if (!profiles.length) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-danger/30 bg-console">
      <p className="border-b border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-danger">
        Synthetic identity torrent
      </p>
      <ul className="max-h-36 space-y-1 overflow-y-auto p-2 font-mono text-[11px] leading-snug text-emerald-100/85">
        {profiles.map((p, i) => (
          <li
            key={`${i}-${p.slice(0, 24)}`}
            className="profile-tick break-all rounded px-2 py-1.5 hover:bg-white/5"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            → {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
