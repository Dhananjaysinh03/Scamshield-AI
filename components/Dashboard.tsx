"use client";

import { useCallback, useRef, useState } from "react";
import { AttackTimeline } from "@/components/AttackTimeline";
import { AudioAlertButton } from "@/components/AudioAlertButton";
import { DismantlePanel } from "@/components/DismantlePanel";
import { EvidenceList } from "@/components/EvidenceList";
import { IntakePanel } from "@/components/IntakePanel";
import { ScanResults } from "@/components/ScanResults";
import { SystemsBadge } from "@/components/SystemsBadge";
import { ThreatConsole } from "@/components/ThreatConsole";
import { ThreatReport } from "@/components/ThreatReport";
import { USE_MOCKS } from "@/lib/mocks/config";
import {
  DEMO_SCENARIOS,
  scenarioToEvidence,
  type DemoScenarioId,
} from "@/lib/mocks/scenarios";
import { getMockTimeline } from "@/lib/mocks/timeline";
import type {
  EvidenceItem,
  ExaResponse,
  ScanResult,
  TimelineResult,
} from "@/lib/types";

export function Dashboard() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [pitching, setPitching] = useState(false);
  const [autoStartToken, setAutoStartToken] = useState(0);
  const [injected, setInjected] = useState(0);
  const [activeScenario, setActiveScenario] =
    useState<DemoScenarioId>("upi_kyc");
  const evidenceRef = useRef(evidence);
  evidenceRef.current = evidence;

  function addEvidence(items: EvidenceItem[]) {
    setEvidence((prev) => [...prev, ...items]);
  }

  function loadScenario(id: DemoScenarioId) {
    const drops = scenarioToEvidence(id);
    setActiveScenario(id);
    setEvidence(drops);
    setScan(null);
    setTimeline(null);
    setTimelineError(null);
    setInjected(0);
    setLines((prev) => [
      ...prev,
      `[Demo]: Loaded scenario "${id}" — ${drops.length} drops.`,
    ]);
  }

  const buildTimeline = useCallback(async (ev?: EvidenceItem[]) => {
    const payload = ev ?? evidenceRef.current;
    if (!payload.length) {
      setLines((prev) => [
        ...prev,
        "[Timeline]: No evidence — add drops before stitching stages.",
      ]);
      setTimelineError("No evidence in session.");
      return null;
    }

    setTimelineLoading(true);
    setTimelineError(null);
    setLines((prev) => [
      ...prev,
      "[Timeline]: Building psychological attack stages…",
    ]);

    try {
      if (USE_MOCKS) {
        const mock = getMockTimeline(payload);
        setTimeline(mock);
        setLines((prev) => [
          ...prev,
          `[Timeline]: Mock mode — ${mock.stages.length} stages ready.`,
        ]);
        return mock;
      }

      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: payload }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as TimelineResult;
      setTimeline(data);
      setLines((prev) =>
        [
          ...prev,
          `[Timeline]: ${data.stages.length} stages stitched.`,
          data.narrative ? `[Timeline]: ${data.narrative}` : "",
        ].filter(Boolean),
      );
      return data;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Timeline request failed.";
      const mock = getMockTimeline(payload);
      setTimeline(mock);
      setTimelineError(null);
      setLines((prev) => [
        ...prev,
        `[Timeline]: API unavailable (${msg}) — using mock stages.`,
      ]);
      return mock;
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const runScan = useCallback(async (ev?: EvidenceItem[]) => {
    const payload = ev ?? evidenceRef.current;
    if (!payload.length) {
      setLines((prev) => [
        ...prev,
        "[Scan]: No evidence in session — add a drop first.",
      ]);
      return null;
    }

    setScanning(true);
    setTimelineLoading(true);
    setTimelineError(null);
    setLines((prev) => [
      ...prev,
      "[Scan]: Fast pipeline — scan + Exa + timeline…",
    ]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: payload }),
      });

      if (!res.ok) throw new Error(`analyze ${res.status}`);

      const data = (await res.json()) as {
        scan: ScanResult;
        timeline: TimelineResult;
        intel: ExaResponse[];
        ms: number;
      };

      setScan(data.scan);
      setTimeline(data.timeline);
      setLines((prev) => {
        const next = [
          ...prev,
          `[Scan]: risk=${data.scan.riskLevel} score=${data.scan.score} urls=${data.scan.urls.length} (${data.ms}ms)`,
          `[Scan]: ${data.scan.summary}`,
          `[Timeline]: ${data.timeline.stages.length} stages — ${data.timeline.narrative}`,
        ];
        for (const block of data.intel) {
          next.push(...block.lines);
        }
        if (!data.intel.length) {
          next.push(
            "[Exa Threat Intel]: No URLs extracted — skipping live intel.",
          );
        }
        return next;
      });
      return data.scan;
    } catch {
      setLines((prev) => [
        ...prev,
        "[Scan]: Fast pipeline failed — falling back…",
      ]);
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evidence: payload }),
        });
        const scanData = (await res.json()) as ScanResult;
        setScan(scanData);
        setLines((prev) => [
          ...prev,
          `[Scan]: risk=${scanData.riskLevel} score=${scanData.score}`,
          `[Scan]: ${scanData.summary}`,
        ]);
        for (const url of scanData.urls) {
          try {
            const er = await fetch("/api/exa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            });
            const intel = (await er.json()) as ExaResponse;
            setLines((prev) => [...prev, ...intel.lines]);
          } catch {
            /* continue */
          }
        }
        await buildTimeline(payload);
        return scanData;
      } catch {
        setLines((prev) => [...prev, "[Scan]: Request failed."]);
        return null;
      }
    } finally {
      setScanning(false);
      setTimelineLoading(false);
    }
  }, [buildTimeline]);

  async function runPitchMode() {
    setPitching(true);
    setLines((prev) => [
      ...prev,
      "[Pitch]: Auto demo armed — Systems A → B → C in sequence.",
    ]);
    const drops = scenarioToEvidence(activeScenario);
    setEvidence(drops);
    setScan(null);
    setTimeline(null);
    setInjected(0);
    evidenceRef.current = drops;

    await new Promise((r) => setTimeout(r, 300));
    const result = await runScan(drops);
    if (
      result &&
      (result.riskLevel === "high" || result.riskLevel === "critical") &&
      result.urls.length
    ) {
      setLines((prev) => [
        ...prev,
        "[Pitch]: Arming System A — reverse-poison honeypot…",
      ]);
      setAutoStartToken((t) => t + 1);
    }
    setPitching(false);
  }

  const pushLine = (line: string) => setLines((prev) => [...prev, line]);

  return (
    <div className="flex flex-col gap-8">
      <SystemsBadge />

      <section data-testid="intake-region" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Demo scenarios
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DEMO_SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadScenario(s.id)}
                disabled={scanning || pitching}
                className={`min-h-11 shrink-0 rounded-lg border px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 ${
                  activeScenario === s.id
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-panel text-foreground hover:border-accent/40"
                }`}
              >
                <span className="font-semibold">{s.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {s.blurb}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void runPitchMode()}
            disabled={scanning || pitching}
            className="min-h-11 rounded-lg bg-accent px-4 text-sm font-bold text-zinc-950 transition hover:bg-accent-dim hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          >
            {pitching ? "Pitch running…" : "▶ Pitch mode (auto)"}
          </button>
          <button
            type="button"
            onClick={() => loadScenario(activeScenario)}
            disabled={scanning || pitching}
            className="min-h-11 rounded-lg border border-dashed border-accent/50 px-4 text-sm font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          >
            Load scenario
          </button>
          <button
            type="button"
            onClick={() => void buildTimeline()}
            disabled={timelineLoading || scanning || pitching}
            className="min-h-11 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          >
            {timelineLoading ? "Building…" : "Build timeline"}
          </button>
        </div>

        <IntakePanel
          onAdd={addEvidence}
          onScan={() => void runScan()}
          scanning={scanning || pitching}
        />
        <EvidenceList items={evidence} />

        <AttackTimeline
          result={timeline}
          evidence={evidence}
          loading={timelineLoading}
          error={timelineError}
        />
      </section>

      <section className="flex flex-col gap-4">
        <ScanResults result={scan} />
        {scan ? (
          <AudioAlertButton summary={scan.summary} onConsoleLine={pushLine} />
        ) : null}
        <DismantlePanel
          scan={scan}
          onConsoleLine={pushLine}
          autoStartToken={autoStartToken}
          onInjectedChange={setInjected}
        />
        <ThreatReport
          scan={scan}
          timeline={timeline}
          consoleLines={lines}
          injected={injected}
        />
        <ThreatConsole lines={lines} />
      </section>
    </div>
  );
}
