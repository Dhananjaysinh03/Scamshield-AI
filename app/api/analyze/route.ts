import { NextResponse } from "next/server";
import { analyzeEvidence } from "@/lib/analyze";
import type { EvidenceItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Pitch-optimized pipeline: scan + timeline + parallel Exa in one request.
 * POST { evidence: EvidenceItem[] }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { evidence?: EvidenceItem[] };
    const evidence = Array.isArray(body.evidence) ? body.evidence : [];
    const result = await analyzeEvidence(evidence);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Analyze failed" }, { status: 400 });
  }
}
