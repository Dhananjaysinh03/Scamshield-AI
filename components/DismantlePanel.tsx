"use client";

import { useEffect, useRef, useState } from "react";
import type {
  HoneypotStartResponse,
  HoneypotStatusResponse,
  RiskLevel,
} from "@/lib/types";

type Props = {
  riskLevel: RiskLevel | null;
  urls: string[];
  onConsole?: (lines: string[]) => void;
};

export function DismantlePanel({ riskLevel, urls, onConsole }: Props) {
  const unlocked =
    !!riskLevel &&
    (riskLevel === "high" || riskLevel === "critical") &&
    urls.length > 0;

  const [targetUrl, setTargetUrl] = useState(urls[0] ?? "");
  const [jobId, setJobId] = useState<string | null>(null);
  const [injected, setInjected] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [hpLines, setHpLines] = useState<string[]>([]);
  const seenLines = useRef(new Set<string>());

  useEffect(() => {
    if (urls[0] && !targetUrl) setTargetUrl(urls[0]);
  }, [urls, targetUrl]);

  useEffect(() => {
    if (!jobId || status !== "running") return;

    const tick = async () => {
      try {
        const res = await fetch(`/api/honeypot/${jobId}`);
        if (!res.ok) return;
        const data = (await res.json()) as HoneypotStatusResponse;
        setInjected(data.injected);
        setStatus(data.status === "running" ? "running" : data.status);

        const fresh = data.lines.filter((l) => !seenLines.current.has(l));
        fresh.forEach((l) => seenLines.current.add(l));
        if (fresh.length) {
          setHpLines((prev) => [...prev, ...fresh].slice(-40));
          onConsole?.(fresh);
        }
      } catch {
        /* keep polling */
      }
    };

    void tick();
    const id = setInterval(() => void tick(), 400);
    return () => clearInterval(id);
  }, [jobId, status, onConsole]);

  if (!unlocked) {
    return (
      <div className="rounded-lg border border-border bg-panel/40 p-4">
        <button
          type="button"
          disabled
          className="min-h-11 w-full cursor-not-allowed rounded-lg border border-border bg-panel px-4 text-sm font-semibold text-muted opacity-60"
        >
          Dismantle Attack
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          Unlocks at high/critical risk with a phishing URL.
        </p>
      </div>
    );
  }

  async function start() {
    seenLines.current.clear();
    setHpLines([]);
    setInjected(0);
    setStatus("running");
    try {
      const res = await fetch("/api/honeypot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          riskLevel,
          intensity: "demo",
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setStatus("error");
        onConsole?.([`[Honeypot]: ${err.error ?? "Start failed"}`]);
        return;
      }
      const data = (await res.json()) as HoneypotStartResponse;
      setJobId(data.jobId);
      onConsole?.([`[Honeypot Active]: Job ${data.jobId} armed (${data.mode})`]);
    } catch {
      setStatus("error");
    }
  }

  async function stop() {
    if (!jobId) return;
    await fetch(`/api/honeypot/${jobId}`, { method: "DELETE" });
    setStatus("done");
  }

  return (
    <div className="rounded-lg border border-danger/40 bg-danger/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-danger">
        Reverse poisoning
      </p>

      <label className="mt-3 block text-xs text-muted">
        Target form URL
        <select
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          disabled={status === "running"}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-console px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
        >
          {urls.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Injected
          </p>
          <p className="font-display text-4xl font-extrabold tabular-nums text-danger sm:text-5xl">
            {injected.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void start()}
            disabled={status === "running"}
            className="min-h-11 rounded-lg bg-danger px-4 text-sm font-semibold text-zinc-950 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-40"
          >
            {status === "running" ? "Corrupting…" : "Dismantle Attack"}
          </button>
          <button
            type="button"
            onClick={() => void stop()}
            disabled={status !== "running"}
            className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          >
            Stop
          </button>
        </div>
      </div>

      {status === "done" || injected >= 500 ? (
        <p className="mt-3 font-mono text-xs text-accent">
          [Honeypot Active]: Injected {injected.toLocaleString()} fake
          credentials. Scammer database corrupted successfully.
        </p>
      ) : null}

      {hpLines.length > 0 ? (
        <div className="mt-3 max-h-28 overflow-y-auto rounded-md border border-border bg-console p-2 font-mono text-[10px] leading-relaxed text-emerald-100/80">
          {hpLines.slice(-8).map((l, i) => (
            <p key={`${i}-${l.slice(0, 20)}`}>{l}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
