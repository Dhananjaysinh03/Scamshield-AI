import { NextResponse } from "next/server";
import { buildTimeline } from "@/lib/timeline";
import type { EvidenceItem, TimelineResult } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { evidence?: EvidenceItem[] };
    const evidence = Array.isArray(body.evidence) ? body.evidence : [];
    const result: TimelineResult = buildTimeline(evidence);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        stages: [],
        narrative: "Invalid timeline payload.",
      } satisfies TimelineResult,
      { status: 400 },
    );
  }
}
