"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HoneypotTerminal } from "@/components/HoneypotTerminal";
import { USE_HONEYPOT_MOCKS } from "@/lib/mocks/config";
import {
  mockPollHoneypot,
  mockStartHoneypot,
  mockStopHoneypot,
} from "@/lib/mocks/honeypot";
import type {
  HoneypotStartResponse,
  HoneypotStatusResponse,
  RiskLevel,
  ScanResult,
} from "@/lib/types";

type Props = {
  scan: ScanResult | null;
  onConsoleLine?: (line: string) => void;
};

const POLL_MS = 400;

export function DismantlePanel({ scan, onConsoleLine }: Props) {
  const risk = scan?.riskLevel ?? null;
  const urls = scan?.urls ?? [];
  const enabled =
    !!risk &&
    (risk === "high" || risk === "critical") &&
    urls.length >= 1;

  const [targetUrl, setTargetUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [injected, setInjected] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [hpLines, setHpLines] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenLines = useRef(0);
  const useMockRef = useRef(USE_HONEYPOT_MOCKS);
  const heroSent = useRef(false);

  useEffect(() => {
    if (urls.length && !targetUrl) {
      setTargetUrl(urls[0]);
    }
  }, [urls, targetUrl]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setRunning(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  function appendLines(next: string[], alsoConsole = false) {
    if (!next.length) return;
    setHpLines((prev) => [...prev, ...next]);
    if (alsoConsole) {
      for (const line of next) {
        onConsoleLine?.(line);
      }
    }
  }

  async function pollOnce(id: string) {
    try {
      let status: HoneypotStatusResponse;
      if (useMockRef.current) {
        status = mockPollHoneypot(id);
        setInjected(status.injected);
        appendLines(status.lines);
      } else {
        const res = await fetch(`/api/honeypot/${id}`);
        if (!res.ok) throw new Error(`poll ${res.status}`);
        status = (await res.json()) as HoneypotStatusResponse;
        setInjected(status.injected);
        const fresh = status.lines.slice(seenLines.current);
        seenLines.current = status.lines.length;
        appendLines(fresh);
      }

      if (status.status === "done" || status.status === "error") {
        if (
          status.status === "done" &&
          status.injected > 0 &&
          !heroSent.current
        ) {
          heroSent.current = true;
          const hero = `[Honeypot Active]: Injected ${status.injected} fake credentials. Scammer database corrupted successfully.`;
          const already = status.lines.some((l) =>
            l.includes("corrupted successfully"),
          );
          if (!already) {
            appendLines([hero], true);
          } else {
            onConsoleLine?.(hero);
          }
        }
        stopPolling();
      }
    } catch {
      appendLines(["[Honeypot Active]: Poll failed — stopping."], true);
      stopPolling();
    }
  }

  async function start() {
    if (!enabled || !targetUrl || !risk) return;

    setHpLines([]);
    setInjected(0);
    seenLines.current = 0;
    heroSent.current = false;
    useMockRef.current = USE_HONEYPOT_MOCKS;
    setRunning(true);
    onConsoleLine?.(
      `[Honeypot Active]: Arming reverse-poison against ${targetUrl}…`,
    );

    try {
      let startRes: HoneypotStartResponse;

      if (USE_HONEYPOT_MOCKS) {
        startRes = mockStartHoneypot({
          targetUrl,
          riskLevel: risk as RiskLevel,
        });
      } else {
        const res = await fetch("/api/honeypot/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUrl,
            riskLevel: risk,
            intensity: "demo",
          }),
        });
        if (!res.ok) {
          useMockRef.current = true;
          startRes = mockStartHoneypot({
            targetUrl,
            riskLevel: risk as RiskLevel,
          });
          appendLines(
            ["[Honeypot Active]: API unavailable — simulated sink engaged."],
            true,
          );
        } else {
          startRes = (await res.json()) as HoneypotStartResponse;
        }
      }

      setJobId(startRes.jobId);
      appendLines([
        `[Honeypot Active]: Job ${startRes.jobId} · mode=${startRes.mode}`,
      ]);

      pollRef.current = setInterval(() => {
        void pollOnce(startRes.jobId);
      }, POLL_MS);
      void pollOnce(startRes.jobId);
    } catch {
      appendLines(["[Honeypot Active]: Start failed."], true);
      setRunning(false);
    }
  }

  function stop() {
    if (jobId && useMockRef.current) {
      mockStopHoneypot(jobId);
    } else if (jobId && !useMockRef.current) {
      void fetch(`/api/honeypot/${jobId}`, { method: "DELETE" });
    }
    stopPolling();
    appendLines(
      [`[Honeypot Active]: Stopped at ${injected} injected credentials.`],
      true,
    );
  }

  if (!scan) return null;

  if (!enabled) {
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
          Locked until risk is high/critical and a phishing URL is present.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-danger/40 bg-danger/5 p-4">
      <p className="font-display text-sm font-bold uppercase tracking-widest text-danger">
        Dismantle Attack
      </p>
      <p className="mt-1 text-xs text-muted">
        Reverse-poison the scammer sink with synthetic credentials.
      </p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-medium text-foreground">
          Target URL
        </span>
        <select
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          disabled={running}
          className="min-h-11 w-full rounded-lg border border-border bg-console px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        >
          {urls.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex flex-col items-center py-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Injected
        </p>
        <p
          className="font-display text-5xl font-extrabold tabular-nums text-accent sm:text-6xl"
          aria-live="polite"
        >
          {injected.toLocaleString()}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void start()}
          disabled={running || !targetUrl}
          className="min-h-11 flex-1 rounded-lg bg-danger px-4 text-sm font-semibold text-zinc-950 transition hover:bg-danger/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:opacity-40"
        >
          {running ? "Injecting…" : "Start"}
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={!running}
          className="min-h-11 flex-1 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.99] disabled:opacity-40"
        >
          Stop
        </button>
      </div>

      <div className="mt-4">
        <HoneypotTerminal lines={hpLines} />
      </div>
    </div>
  );
}
