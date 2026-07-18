import type { EmailAnalysisResult } from "@/lib/email/types";

/** Plain-text verdict people can copy / paste into chat */
export function formatVerdictShare(
  result: EmailAnalysisResult,
  fromHint?: string | null,
): string {
  const from =
    fromHint ||
    result.technicalFindings.sender.email ||
    result.technicalFindings.sender.displayName ||
    "unknown sender";
  const stop =
    result.preventionLevel === "hard_stop"
      ? "HARD STOP — do not OTP / pay / open file / share screen."
      : result.verdict === "phishing"
        ? "Treat as phishing."
        : result.verdict === "suspicious"
          ? "Be careful — verify before acting."
          : "No strong trap found — still stay careful.";

  const reasons = result.reasons.slice(0, 3).map((r) => `• ${r}`).join("\n");
  const types = result.scamType.slice(0, 4).join(", ") || "—";

  return [
    `ScamShield check`,
    `From: ${from}`,
    `Verdict: ${result.verdict.toUpperCase()} · score ${result.riskScore}/100 · ${result.confidence} confidence`,
    stop,
    `Patterns: ${types}`,
    reasons ? `Why:\n${reasons}` : "",
    result.meta
      ? `Engine ${result.meta.engineVersion} · ${result.meta.signalCount} signals · ${result.meta.durationMs}ms`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
