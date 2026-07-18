import { NextResponse } from "next/server";
import { getHoneypotStatus, stopHoneypot } from "@/lib/honeypot";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ jobId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { jobId } = await ctx.params;
  const status = getHoneypotStatus(jobId);
  if (!status) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json(status);
}

/** Optional stop: DELETE /api/honeypot/[jobId] */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { jobId } = await ctx.params;
  const ok = stopHoneypot(jobId);
  if (!ok) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const status = getHoneypotStatus(jobId);
  return NextResponse.json(status);
}
