"use client";

import { useCallback, useState } from "react";
import { AttackTimeline } from "@/components/AttackTimeline";
import { AudioAlertButton } from "@/components/AudioAlertButton";
import { DismantlePanel } from "@/components/DismantlePanel";
import { EvidenceList } from "@/components/EvidenceList";
import { IntakePanel } from "@/components/IntakePanel";
import { ScanResults } from "@/components/ScanResults";
import { ThreatConsole } from "@/components/ThreatConsole";
import { createDemoFunnel } from "@/lib/mocks/demoFunnel";
import type {
  EvidenceItem,
  ExaResponse,
  ScanResult,
  TimelineResult,
} from "@/lib/types";

export function Dashboard() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  function addEvidence(items: EvidenceItem[]) {
    setEvidence((prev) => [...prev, ...items]);
  }

  function appendLines(next: string[]) {
    setLines((prev) => [...prev, ...next]);
  }

  const onConsoleLines = useCallback((next: string[]) => {
    setLines((prev) => [...prev, ...next]);
  }, []);

  function loadDemo() {
    const demo = createDemoFunnel();
    setEvidence(demo);
    setScan(null);
    setTimeline(null);
    appendLines(["[Demo]: Loaded 3-drop phishing funnel (SMS → WhatsApp → payment)."]);
  }

  async function buildTimeline(ev: EvidenceItem[] = evidence) {
    if (!ev.length) {
      appendLines(["[Timeline]: No evidence - add drops first."]);
      return;
    }
    setTimelineLoading(true);
    appendLines(["[Timeline]: Stitching multi-stage funnel…"]);
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: ev }),
      });
      const data = (await res.json()) as TimelineResult;
      setTimeline(data);
      appendLines([
        `[Timeline]: ${data.stages.length} stage(s)`,
        `[Timeline]: ${data.narrative}`,
      ]);
    } catch {
      appendLines(["[Timeline]: Request failed."]);
    } finally {
      setTimelineLoading(false);
    }
  }

  async function runScan() {
    if (!evidence.length) {
      appendLines(["[Scan]: No evidence in session - add a drop first."]);
      return;
    }

    setScanning(true);
    appendLines(["[Scan]: Analyzing evidence funnel…"]);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence }),
      });
      const data = (await res.json()) as ScanResult;
      setScan(data);
      appendLines([
        `[Scan]: risk=${data.riskLevel} score=${data.score} urls=${data.urls.length}`,
        `[Scan]: ${data.summary}`,
      ]);

      for (const url of data.urls) {
        appendLines([`[Exa Threat Intel]: Querying consensus for ${url}…`]);
        try {
          const er = await fetch("/api/exa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const intel = (await er.json()) as ExaResponse;
          appendLines(intel.lines);
        } catch {
          appendLines([`[Exa Threat Intel]: Request failed for ${url}`]);
        }
      }

      if (data.urls.length === 0) {
        appendLines([
          "[Exa Threat Intel]: No URLs extracted - skipping live intel.",
        ]);
      }

      await buildTimeline(evidence);
    } catch {
      appendLines(["[Scan]: Request failed."]);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section data-testid="intake-region" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={loadDemo}
            className="min-h-11 rounded-lg border border-accent/40 bg-accent/10 px-4 text-sm font-medium text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Load demo funnel
          </button>
          <button
            type="button"
            onClick={() => void buildTimeline()}
            disabled={timelineLoading || !evidence.length}
            className="min-h-11 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          >
            {timelineLoading ? "Building…" : "Build timeline"}
          </button>
          <AudioAlertButton
            text={scan?.summary ?? null}
            onConsole={(line) => appendLines([line])}
          />
        </div>

        <IntakePanel
          onAdd={addEvidence}
          onScan={() => void runScan()}
          scanning={scanning}
        />
        <EvidenceList items={evidence} />
      </section>

      <AttackTimeline
        timeline={timeline}
        evidence={evidence}
        loading={timelineLoading}
      />

      <section className="flex flex-col gap-4">
        <ScanResults result={scan} />
        <DismantlePanel
          riskLevel={scan?.riskLevel ?? null}
          urls={scan?.urls ?? []}
          onConsole={onConsoleLines}
        />
        <ThreatConsole lines={lines} />
      </section>
    </div>
  );
}
