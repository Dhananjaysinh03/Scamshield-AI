import Exa from "exa-js";
import { NextResponse } from "next/server";
import type { ExaResponse } from "@/lib/types";

export const runtime = "nodejs";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function demoLines(url: string): string[] {
  const host = hostnameOf(url);
  return [
    `[DEMO MODE] [Exa Threat Intel]: No EXA_API_KEY - synthetic consensus for ${host}.`,
    `[DEMO MODE] [Exa Threat Intel]: Domain pattern matches recent offshore registrar spikes; 2 community threads flag similar funnels as active fraud.`,
    `[DEMO MODE] [Exa Threat Intel]: Recommend blocking outbound submissions and arming reverse-poison honeypot if risk is high.`,
  ];
}

type IntelHit = {
  title?: string | null;
  url?: string | null;
  highlights?: string[] | null;
  text?: string | null;
};

function asHits(results: unknown): IntelHit[] {
  if (!Array.isArray(results)) return [];
  return results as IntelHit[];
}

function mapLiveLines(url: string, results: IntelHit[]): string[] {
  const host = hostnameOf(url);
  if (!results.length) {
    return [
      `[Exa Threat Intel]: No public consensus found for ${host}.`,
      `[Exa Threat Intel]: Treat unknown/new domains as hostile until proven otherwise.`,
    ];
  }

  const header = `[Exa Threat Intel]: Live consensus for ${host} — ${results.length} source(s).`;
  const body = results.slice(0, 3).map((r, i) => {
    const raw =
      r.highlights?.filter(Boolean).join(" ") ||
      r.text?.slice(0, 180) ||
      r.title ||
      "No excerpt";
    const highlight = raw.replace(/\s+/g, " ").trim().slice(0, 220);
    const source = r.url ? ` (${r.url})` : "";
    return `[Exa Threat Intel]: (${i + 1}) ${highlight}${source}`;
  });
  return [header, ...body];
}

export async function POST(req: Request) {
  let url = "";
  try {
    const body = (await req.json()) as { url?: string };
    url = (body.url || "").trim();
    if (!url) {
      return NextResponse.json(
        { mode: "empty", url: "", lines: ["[Exa Threat Intel]: Missing url"] } satisfies ExaResponse,
        { status: 200 },
      );
    }

    const key = process.env.EXA_API_KEY;
    if (!key) {
      return NextResponse.json({
        mode: "demo",
        url,
        lines: demoLines(url),
      } satisfies ExaResponse);
    }

    const exa = new Exa(key);
    const host = hostnameOf(url);
    const query = `"${host}" (phishing OR scam OR fraud OR "fake login" OR "credential harvest")`;

    try {
      const response = await exa.search(query, {
        type: "auto",
        numResults: 3,
        category: "news",
        contents: {
          highlights: true,
          text: { maxCharacters: 500 },
        },
      });

      let results = asHits(response.results);
      if (results.length === 0) {
        const fallback = await exa.search(query, {
          type: "auto",
          numResults: 3,
          contents: { text: { maxCharacters: 500 } },
        });
        results = asHits(fallback.results);
      }

      const lines = mapLiveLines(url, results);
      return NextResponse.json({
        mode: results.length ? "live" : "empty",
        url,
        lines,
      } satisfies ExaResponse);
    } catch {
      try {
        const response = await exa.search(query, {
          type: "auto",
          numResults: 3,
          contents: { text: { maxCharacters: 800 } },
        });
        const hits = asHits(response.results);
        const lines = mapLiveLines(url, hits);
        return NextResponse.json({
          mode: hits.length ? "live" : "empty",
          url,
          lines,
        } satisfies ExaResponse);
      } catch {
        return NextResponse.json({
          mode: "demo",
          url,
          lines: [
            `[Exa Threat Intel]: Live search failed for ${host}; falling back.`,
            ...demoLines(url).slice(1),
          ],
        } satisfies ExaResponse);
      }
    }
  } catch {
    return NextResponse.json(
      {
        mode: "empty",
        url,
        lines: ["[Exa Threat Intel]: Bad request"],
      } satisfies ExaResponse,
      { status: 200 },
    );
  }
}
