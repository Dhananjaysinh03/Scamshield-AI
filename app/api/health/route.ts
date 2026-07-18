import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Render / uptime probe — no secrets. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "scamshield-ai",
    product: "email-phishing-check",
    ts: new Date().toISOString(),
    engine: "1.2.0",
    exa: Boolean(process.env.EXA_API_KEY),
    llm: Boolean(process.env.OPENAI_API_KEY),
    audio: Boolean(process.env.ELEVENLABS_API_KEY),
    endpoints: {
      analyze: "POST /api/email-analyze",
      engineInfo: "GET /api/email-analyze",
      ocr: "POST /api/ocr",
    },
  });
}
