import { NextResponse } from "next/server";
import { startHoneypot } from "@/lib/honeypot";
import type { HoneypotStartRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HoneypotStartRequest;
    const result = startHoneypot({
      targetUrl: body.targetUrl,
      riskLevel: body.riskLevel,
      intensity: body.intensity,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid honeypot payload" }, { status: 400 });
  }
}
