import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Render / uptime probe — no secrets. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "scamshield-ai",
    ts: new Date().toISOString(),
    exa: Boolean(process.env.EXA_API_KEY),
    llm: Boolean(process.env.OPENAI_API_KEY),
    audio: Boolean(process.env.ELEVENLABS_API_KEY),
  });
}
