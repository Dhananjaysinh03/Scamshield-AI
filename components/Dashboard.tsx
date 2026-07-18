"use client";

import { useCallback, useRef, useState } from "react";
import { AttackTimeline } from "@/components/AttackTimeline";
import { AudioAlertButton } from "@/components/AudioAlertButton";
import { DismantlePanel } from "@/components/DismantlePanel";
import { EvidenceList } from "@/components/EvidenceList";
import { IntakePanel } from "@/components/IntakePanel";
import { ScanResults } from "@/components/ScanResults";
import { ThreatConsole } from "@/components/ThreatConsole";
import { ThreatReport } from "@/components/ThreatReport";
import { UserStep } from "@/components/UserStep";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const evidenceRef = useRef(evidence);
  evidenceRef.current = evidence;
  const resultsRef = useRef<HTMLDivElement>(null);

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
      `[Demo]: Loaded example "${id}" — ${drops.length} messages.`,
    ]);
  }

  const buildTimeline = useCallback(async (ev?: EvidenceItem[]) => {
    const payload = ev ?? evidenceRef.current;
    if (!payload.length) {
      setTimelineError("Add a message first.");
      return null;
    }

    setTimelineLoading(true);
    setTimelineError(null);

    try {
      if (USE_MOCKS) {
        const mock = getMockTimeline(payload);
        setTimeline(mock);
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

  const runScan = useCallback(
    async (ev?: EvidenceItem[]) => {
      const payload = ev ?? evidenceRef.current;
      if (!payload.length) {
        setLines((prev) => [
          ...prev,
          "[Scan]: No message yet — paste one first.",
        ]);
        return null;
      }

      evidenceRef.current = payload;
      setEvidence(payload);
      setScanning(true);
      setTimelineLoading(true);
      setTimelineError(null);
      setLines((prev) => [...prev, "[Scan]: Checking message…"]);

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
            `[Scan]: risk=${data.scan.riskLevel} score=${data.scan.score} (${data.ms}ms)`,
            `[Scan]: ${data.scan.summary}`,
            `[Timeline]: ${data.timeline.stages.length} stages`,
          ];
          for (const block of data.intel) next.push(...block.lines);
          return next;
        });
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return data.scan;
      } catch {
        setLines((prev) => [
          ...prev,
          "[Scan]: Fast check failed — trying again…",
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
          requestAnimationFrame(() => {
            resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
          return scanData;
        } catch {
          setLines((prev) => [...prev, "[Scan]: Request failed."]);
          return null;
        }
      } finally {
        setScanning(false);
        setTimelineLoading(false);
      }
    },
    [buildTimeline],
  );

  async function runDemo() {
    setPitching(true);
    const drops = scenarioToEvidence(activeScenario);
    setEvidence(drops);
    setScan(null);
    setTimeline(null);
    setInjected(0);
    evidenceRef.current = drops;

    await new Promise((r) => setTimeout(r, 80));
    const result = await runScan(drops);
    if (
      result &&
      (result.riskLevel === "high" || result.riskLevel === "critical") &&
      result.urls.length
    ) {
      setAutoStartToken((t) => t + 1);
      setShowAdvanced(true);
    }
    setPitching(false);
  }

  function handleCheck(extra?: EvidenceItem[]) {
    const payload = extra?.length
      ? [...evidenceRef.current, ...extra]
      : undefined;
    void runScan(payload);
  }

  const pushLine = (line: string) => setLines((prev) => [...prev, line]);

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 lg:max-w-none">
      <div className="rounded-2xl border border-border bg-panel-soft/80 px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold text-foreground">
          Not sure what to paste? Try an example
        </p>
        <p className="mt-1 text-sm text-muted">
          Pick one, then tap “Check this example” — we’ll walk you through it.
        </p>
        <div className="chip-rail mt-3">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadScenario(s.id)}
              disabled={scanning || pitching}
              className={`min-h-12 w-[12rem] shrink-0 rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 sm:w-[14rem] ${
                activeScenario === s.id
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-panel text-foreground hover:border-accent/40"
              }`}
            >
              <span className="block text-sm font-semibold leading-tight">
                {s.label}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">
                {s.blurb}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void runDemo()}
          disabled={scanning || pitching}
          className="mt-3 min-h-12 w-full rounded-xl border border-accent/40 bg-accent-soft px-4 text-base font-semibold text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 sm:w-auto"
        >
          {pitching ? "Running example…" : "Check this example"}
        </button>
      </div>

      <div className="grid min-w-0 w-full grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-7">
          <UserStep
            step={1}
            title="Paste the suspicious message"
            hint="SMS, WhatsApp, email — copy and paste the text you received."
          >
            <div data-testid="intake-region" className="flex flex-col gap-4">
              <IntakePanel
                onAdd={addEvidence}
                onScan={handleCheck}
                scanning={scanning || pitching}
                hasEvidence={evidence.length > 0}
              />
              <EvidenceList items={evidence} />
            </div>
          </UserStep>

          <div ref={resultsRef}>
            <UserStep
              step={2}
              title="See the result"
              hint="We’ll say how risky it looks and why — in plain language."
            >
              {scan ? (
                <div className="flex flex-col gap-5">
                  <ScanResults result={scan} />
                  <AudioAlertButton
                    summary={scan.summary}
                    onConsoleLine={pushLine}
                  />
                  <AttackTimeline
                    result={timeline}
                    evidence={evidence}
                    loading={timelineLoading}
                    error={timelineError}
                  />
                </div>
              ) : (
                <p className="text-base leading-relaxed text-muted">
                  Your result will appear here after you check a message.
                </p>
              )}
            </UserStep>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6 xl:col-span-5 xl:sticky xl:top-20 xl:self-start">
          <UserStep
            step={3}
            title="What you can do next"
            hint="Save a report, or use extra protection if there’s a fake website."
          >
            <div className="flex flex-col gap-4">
              <ThreatReport
                scan={scan}
                timeline={timeline}
                consoleLines={lines}
                injected={injected}
              />
              <DismantlePanel
                scan={scan}
                onConsoleLine={pushLine}
                autoStartToken={autoStartToken}
                onInjectedChange={setInjected}
              />

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="min-h-11 self-start text-sm font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                {showAdvanced ? "Hide technical details" : "Show technical details"}
              </button>
              {showAdvanced ? <ThreatConsole lines={lines} /> : null}
            </div>
          </UserStep>
        </div>
      </div>
    </div>
  );
}
