"use client";

import type { RiskLevel } from "@/lib/types";

export function DismantleTeaser({ riskLevel }: { riskLevel: RiskLevel | null }) {
  if (!riskLevel || (riskLevel !== "high" && riskLevel !== "critical")) {
    return null;
  }

  return (
    <div className="rounded-lg border border-danger/40 bg-danger/5 p-4">
      <button
        type="button"
        disabled
        className="min-h-11 w-full cursor-not-allowed rounded-lg border border-danger/50 bg-danger/20 px-4 text-sm font-semibold text-danger opacity-80"
      >
        Dismantle Attack
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Honeypot arming in Phase 3 — reverse-poison panel locked for now.
      </p>
    </div>
  );
}
