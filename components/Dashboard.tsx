"use client";

import { useState } from "react";
import { AttackTimeline } from "@/components/AttackTimeline";
import { DismantleTeaser } from "@/components/DismantleTeaser";
import { EvidenceList } from "@/components/EvidenceList";
import { IntakePanel } from "@/components/IntakePanel";
import { ScanResults } from "@/components/ScanResults";
import { ThreatConsole } from "@/components/ThreatConsole";
import { USE_MOCKS } from "@/lib/mocks/config";
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

  function addEvidence(items: EvidenceItem[]) {
    setEvidence((prev) => [...prev, ...items]);
  }

  async function buildTimeline() {
    if (!evidence.length) {
      setLines((prev) => [
        ...prev,
        "[Timeline]: No evidence — add drops before stitching stages.",
      ]);
      setTimelineError("No evidence in session.");
      return;
    }

    setTimelineLoading(true);
    setTimelineError(null);
    setLines((prev) => [
      ...prev,
      "[Timeline]: Building psychological attack stages…",
    ]);

    try {
      if (USE_MOCKS) {
        const mock = getMockTimeline(evidence);
        setTimeline(mock);
        setLines((prev) => [
          ...prev,
          `[Timeline]: Mock mode — ${mock.stages.length} stages ready.`,
        ]);
        return;
      }

      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as TimelineResult;
      setTimeline(data);
      setLines((prev) => [
        ...prev,
        `[Timeline]: ${data.stages.length} stages stitched.`,
        data.narrative ? `[Timeline]: ${data.narrative}` : "",
      ].filter(Boolean));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Timeline request failed.";
      /* Offline / BE pending: fall back to mocks so pitch still works */
      const mock = getMockTimeline(evidence);
      setTimeline(mock);
      setTimelineError(null);
      setLines((prev) => [
        ...prev,
        `[Timeline]: API unavailable (${msg}) — using mock stages.`,
      ]);
    } finally {
      setTimelineLoading(false);
    }
  }

  async function runScan() {
    if (!evidence.length) {
      setLines((prev) => [
        ...prev,
        "[Scan]: No evidence in session — add a drop first.",
      ]);
      return;
    }

    setScanning(true);
    setLines((prev) => [...prev, "[Scan]: Analyzing evidence funnel…"]);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence }),
      });
      const data = (await res.json()) as ScanResult;
      setScan(data);
      setLines((prev) => [
        ...prev,
        `[Scan]: risk=${data.riskLevel} score=${data.score} urls=${data.urls.length}`,
        `[Scan]: ${data.summary}`,
      ]);

      for (const url of data.urls) {
        setLines((prev) => [
          ...prev,
          `[Exa Threat Intel]: Querying consensus for ${url}…`,
        ]);
        try {
          const er = await fetch("/api/exa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const intel = (await er.json()) as ExaResponse;
          setLines((prev) => [...prev, ...intel.lines]);
        } catch {
          setLines((prev) => [
            ...prev,
            `[Exa Threat Intel]: Request failed for ${url}`,
          ]);
        }
      }

      if (data.urls.length === 0) {
        setLines((prev) => [
          ...prev,
          "[Exa Threat Intel]: No URLs extracted — skipping live intel.",
        ]);
      }
    } catch {
      setLines((prev) => [...prev, "[Scan]: Request failed."]);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section data-testid="intake-region" className="flex flex-col gap-4">
        <IntakePanel
          onAdd={addEvidence}
          onScan={() => void runScan()}
          scanning={scanning}
        />
        <EvidenceList items={evidence} />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void buildTimeline()}
            disabled={timelineLoading || scanning}
            className="min-h-11 w-full rounded-lg border border-accent/50 bg-accent/10 px-4 text-sm font-semibold text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:opacity-40 sm:w-auto sm:self-start"
          >
            {timelineLoading ? "Building…" : "Build timeline"}
          </button>
          <AttackTimeline
            result={timeline}
            evidence={evidence}
            loading={timelineLoading}
            error={timelineError}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <ScanResults result={scan} />
        <DismantleTeaser riskLevel={scan?.riskLevel ?? null} />
        <ThreatConsole lines={lines} />
      </section>
    </div>
  );
}
