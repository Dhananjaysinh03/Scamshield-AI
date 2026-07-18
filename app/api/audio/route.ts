import { NextResponse } from "next/server";
import { synthesizeReadout } from "@/lib/audio";
import type { AudioReadoutRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AudioReadoutRequest;
    const result = await synthesizeReadout({ text: body.text ?? "" });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { mode: "stub", message: "[Audio Stub]: Bad request." },
      { status: 200 },
    );
  }
}
