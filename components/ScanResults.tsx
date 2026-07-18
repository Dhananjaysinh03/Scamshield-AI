"use client";

import type { ScanResult } from "@/lib/types";

const RISK_COPY: Record<
  ScanResult["riskLevel"],
  { title: string; advice: string; tone: string; chip: string }
> = {
  low: {
    title: "Looks safer",
    advice:
      "We didn’t find strong scam signs. Still avoid sharing OTPs or passwords.",
    tone: "text-accent",
    chip: "bg-accent-soft text-accent",
  },
  medium: {
    title: "Be careful",
    advice:
      "Some warning signs showed up. Don’t click links or send money until you verify another way.",
    tone: "text-amber-700 dark:text-amber-400",
    chip: "bg-amber-500/15 text-amber-800 dark:text-amber-400",
  },
  high: {
    title: "Likely a scam",
    advice:
      "This message shows common scam patterns. Do not click links, share OTPs, or pay anything.",
    tone: "text-orange-700 dark:text-orange-400",
    chip: "bg-orange-500/15 text-orange-800 dark:text-orange-400",
  },
  critical: {
    title: "Dangerous scam",
    advice:
      "Strong signs of fraud. Block the sender, don’t reply, and never share bank or OTP details.",
    tone: "text-danger",
    chip: "bg-danger-soft text-danger",
  },
};

export function ScanResults({ result }: { result: ScanResult | null }) {
  if (!result) return null;

  const copy = RISK_COPY[result.riskLevel];
  const summary = result.plainSummary || result.summary;
  const nextSteps = result.advice?.length ? result.advice : [copy.advice];

  return (
    <div className="rounded-2xl border border-border bg-panel p-5 shadow-sm sm:p-6 dark:shadow-none">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${copy.chip}`}
        >
          {copy.title}
        </span>
        <span className="text-sm text-muted">Match score {result.score}/100</span>
      </div>

      <p
        className={`mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl ${copy.tone}`}
      >
        {copy.title}
      </p>
      <p className="mt-2 text-base leading-relaxed text-foreground/90">
        {summary}
      </p>

      {result.malware?.detected ? (
        <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          Malware / remote-access lure detected — do not download or install
          anything.
        </p>
      ) : null}

      <div className="mt-4">
        <p className="text-sm font-semibold text-foreground">What you should do</p>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted">
          {nextSteps.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      {result.urls.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">
            Suspicious links found
          </p>
          <p className="mt-1 text-sm text-muted">
            Don’t open these. Real banks won’t rush you through odd links.
          </p>
          <ul className="mt-3 space-y-2">
            {result.urls.map((u) => (
              <li
                key={u}
                className="break-all rounded-xl bg-panel-soft px-3 py-2.5 font-mono text-xs text-accent"
              >
                {u}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.signals.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">
            Why we flagged this
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted">
            {result.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
