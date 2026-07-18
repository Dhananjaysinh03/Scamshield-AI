"use client";

import { useState } from "react";
import { DismantleTeaser } from "@/components/DismantleTeaser";
import { EvidenceList } from "@/components/EvidenceList";
import { IntakePanel } from "@/components/IntakePanel";
import { ScanResults } from "@/components/ScanResults";
import { ThreatConsole } from "@/components/ThreatConsole";
import type { EvidenceItem, ExaResponse, ScanResult } from "@/lib/types";

export function Dashboard() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  function addEvidence(items: EvidenceItem[]) {
    setEvidence((prev) => [...prev, ...items]);
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
      </section>

      <section className="flex flex-col gap-4">
        <ScanResults result={scan} />
        <DismantleTeaser riskLevel={scan?.riskLevel ?? null} />
        <ThreatConsole lines={lines} />
      </section>
    </div>
  );
}
