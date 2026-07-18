"use client";

type Props = {
  profiles: string[];
};

export function ProfileTicker({ profiles }: Props) {
  if (!profiles.length) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-danger/25 bg-console">
      <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-danger">
        Fake details being sent (not yours)
      </p>
      <ul className="max-h-36 space-y-1 overflow-y-auto p-2 font-mono text-[11px] leading-snug text-console-fg">
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
