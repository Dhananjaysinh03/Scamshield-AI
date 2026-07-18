"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HoneypotTerminal } from "@/components/HoneypotTerminal";
import { ProfileTicker } from "@/components/ProfileTicker";
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
  /** Increment to auto-start when unlocked (pitch mode) */
  autoStartToken?: number;
  onInjectedChange?: (n: number) => void;
};

const POLL_MS = 400;

export function DismantlePanel({
  scan,
  onConsoleLine,
  autoStartToken = 0,
  onInjectedChange,
}: Props) {
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
  const [profiles, setProfiles] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenLines = useRef(0);
  const useMockRef = useRef(USE_HONEYPOT_MOCKS);
  const heroSent = useRef(false);
  const lastAuto = useRef(0);
  const startRef = useRef<() => Promise<void>>(async () => {});

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

  function setInjectedBoth(n: number) {
    setInjected(n);
    onInjectedChange?.(n);
  }

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
        setInjectedBoth(status.injected);
        appendLines(status.lines);
        if (status.lastProfilePreview) {
          setProfiles((prev) =>
            [status.lastProfilePreview!, ...prev].slice(0, 12),
          );
        }
      } else {
        const res = await fetch(`/api/honeypot/${id}`);
        if (!res.ok) throw new Error(`poll ${res.status}`);
        status = (await res.json()) as HoneypotStatusResponse;
        setInjectedBoth(status.injected);
        const fresh = status.lines.slice(seenLines.current);
        seenLines.current = status.lines.length;
        appendLines(fresh);
        if (status.recentProfiles?.length) {
          setProfiles(status.recentProfiles);
        } else if (status.lastProfilePreview) {
          setProfiles((prev) =>
            [status.lastProfilePreview!, ...prev].slice(0, 12),
          );
        }
      }

      if (status.status === "done" || status.status === "error") {
        if (
          status.status === "done" &&
          status.injected > 0 &&
          !heroSent.current
        ) {
          heroSent.current = true;
          const hero = `[Honeypot Active]: Injected ${status.injected.toLocaleString()} fake credentials. Scammer database corrupted successfully.`;
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
    if (!enabled || !targetUrl || !risk || running) return;

    setHpLines([]);
    setProfiles([]);
    setInjectedBoth(0);
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
            intensity: "burst",
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

  startRef.current = start;

  useEffect(() => {
    if (!autoStartToken || autoStartToken === lastAuto.current) return;
    if (!enabled || !targetUrl) return;
    lastAuto.current = autoStartToken;
    const t = setTimeout(() => void startRef.current(), 180);
    return () => clearTimeout(t);
  }, [autoStartToken, enabled, targetUrl]);

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
      <div className="rounded-2xl border border-border bg-panel-soft p-5">
        <p className="font-display text-base font-bold text-foreground">
          Extra protection
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          If a message looks like a serious scam and includes a fake website,
          you can confuse the scammer so they waste time on fake details — not
          yours.
        </p>
        <p className="mt-3 text-sm text-muted">
          Available when risk is high and a suspicious link is found.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-2xl border border-danger/35 bg-danger-soft p-5">
      <p className="font-display text-lg font-bold tracking-tight text-danger">
        Confuse the scammer
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-base">
        We can send them many fake names and passwords so their fake website
        fills with junk. This does not send your real information.
      </p>

      <label className="mt-4 block min-w-0">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Fake website to target
        </span>
        <select
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          disabled={running}
          className="min-h-12 w-full max-w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        >
          {urls.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 flex flex-col items-center rounded-2xl bg-panel/80 py-4">
        <p className="text-sm font-medium text-muted">Fake details sent</p>
        <p
          className={`font-display text-4xl font-extrabold tabular-nums text-accent sm:text-5xl ${running ? "counter-pulse" : ""}`}
          aria-live="polite"
        >
          {injected.toLocaleString()}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void start()}
          disabled={running || !targetUrl}
          className="min-h-12 flex-1 rounded-xl bg-danger px-4 text-base font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-40"
        >
          {running ? "Working…" : "Start protection"}
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={!running}
          className="min-h-12 flex-1 rounded-xl border border-border bg-panel px-4 text-base font-medium text-foreground transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
        >
          Stop
        </button>
      </div>

      <ProfileTicker profiles={profiles} />

      <div className="mt-4">
        <HoneypotTerminal lines={hpLines} />
      </div>
    </div>
  );
}
