import { NextResponse } from "next/server";
import { scoreEvidence } from "@/lib/heuristics";
import type { EvidenceItem, ScanResult } from "@/lib/types";

export const runtime = "nodejs";

async function optionalLlmSummary(
  scan: ScanResult,
  texts: string[],
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return scan.summary;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              "You are a concise SOC analyst. One sentence risk summary. No markdown.",
          },
          {
            role: "user",
            content: `Score ${scan.score} (${scan.riskLevel}). Signals: ${scan.signals.join("; ")}. Evidence:\n${texts.join("\n").slice(0, 2000)}`,
          },
        ],
      }),
    });
    if (!res.ok) return scan.summary;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() || scan.summary;
  } catch {
    return scan.summary;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { evidence?: EvidenceItem[] };
    const evidence = Array.isArray(body.evidence) ? body.evidence : [];
    const texts = evidence.map((e) => e.content).filter(Boolean);

    if (texts.length === 0) {
      return NextResponse.json(
        {
          riskLevel: "low",
          score: 0,
          urls: [],
          signals: ["No evidence provided"],
          summary: "Add text or files before scanning.",
        } satisfies ScanResult,
        { status: 200 },
      );
    }

    const scan = scoreEvidence(texts);
    const summary = await optionalLlmSummary(scan, texts);

    return NextResponse.json({ ...scan, summary } satisfies ScanResult);
  } catch {
    return NextResponse.json(
      { error: "Invalid scan payload" },
      { status: 400 },
    );
  }
}
