import { emptyScan, scoreEvidence } from "@/lib/heuristics";
import { buildTimeline } from "@/lib/timeline";
import type {
  EvidenceItem,
  ExaResponse,
  ScanResult,
  TimelineResult,
} from "@/lib/types";
import Exa from "exa-js";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function demoIntel(url: string): ExaResponse {
  const host = hostnameOf(url);
  return {
    mode: "demo",
    url,
    lines: [
      `[DEMO MODE] [Exa Threat Intel]: No EXA_API_KEY - synthetic consensus for ${host}.`,
      `[DEMO MODE] [Exa Threat Intel]: Domain pattern matches recent offshore registrar spikes; community flags similar funnels as active fraud.`,
      `[DEMO MODE] [Exa Threat Intel]: Recommend blocking outbound submissions and arming reverse-poison honeypot.`,
    ],
  };
}

async function liveIntel(url: string, key: string): Promise<ExaResponse> {
  const host = hostnameOf(url);
  const query = `"${host}" (phishing OR scam OR fraud OR "fake login")`;
  try {
    const exa = new Exa(key);
    let response = await exa.search(query, {
      type: "auto",
      numResults: 3,
      category: "news",
      contents: { highlights: true, text: { maxCharacters: 400 } },
    });
    let results = response.results ?? [];
    if (!results.length) {
      response = await exa.search(query, {
        type: "auto",
        numResults: 3,
        contents: { text: { maxCharacters: 400 } },
      });
      results = response.results ?? [];
    }

    if (!results.length) {
      return {
        mode: "empty",
        url,
        lines: [
          `[Exa Threat Intel]: No public consensus found for ${host}.`,
          `[Exa Threat Intel]: Treat unknown/new domains as hostile until proven otherwise.`,
        ],
      };
    }

    const header = `[Exa Threat Intel]: Live consensus for ${host} — ${results.length} source(s).`;
    const body = results.slice(0, 3).map((r, i) => {
      const raw =
        (r as { highlights?: string[] }).highlights?.filter(Boolean).join(" ") ||
        (r as { text?: string }).text?.slice(0, 180) ||
        r.title ||
        "No excerpt";
      const highlight = String(raw).replace(/\s+/g, " ").trim().slice(0, 220);
      const source = r.url ? ` (${r.url})` : "";
      return `[Exa Threat Intel]: (${i + 1}) ${highlight}${source}`;
    });

    return { mode: "live", url, lines: [header, ...body] };
  } catch {
    return {
      mode: "demo",
      url,
      lines: [
        `[Exa Threat Intel]: Live search failed for ${host}; falling back.`,
        ...demoIntel(url).lines.slice(1),
      ],
    };
  }
}

export type AnalyzeResult = {
  scan: ScanResult;
  timeline: TimelineResult;
  intel: ExaResponse[];
  ms: number;
};

/** Single round-trip for pitch mode: heuristics + timeline + parallel Exa. */
export async function analyzeEvidence(
  evidence: EvidenceItem[],
): Promise<AnalyzeResult> {
  const t0 = Date.now();
  const texts = evidence.map((e) => e.content).filter(Boolean);
  const scan: ScanResult =
    texts.length === 0 ? emptyScan() : scoreEvidence(texts);

  const timeline = buildTimeline(evidence);
  const key = process.env.EXA_API_KEY;

  const intel = await Promise.all(
    scan.urls.slice(0, 4).map((url) =>
      key ? liveIntel(url, key) : Promise.resolve(demoIntel(url)),
    ),
  );

  return {
    scan,
    timeline,
    intel,
    ms: Date.now() - t0,
  };
}
