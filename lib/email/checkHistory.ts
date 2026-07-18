import type { EmailAnalysisResult, EmailVerdict } from "@/lib/email/types";

const KEY = "scamshield-check-history-v1";
const MAX = 25;

export type CheckHistoryItem = {
  id: string;
  at: number;
  preview: string;
  verdict: EmailVerdict;
  riskScore: number;
  preventionLevel: EmailAnalysisResult["preventionLevel"];
  fromEmail: string | null;
  scamTypes: string[];
  /** Compact snapshot for re-open without re-paste */
  result: EmailAnalysisResult;
};

function safeParse(raw: string | null): CheckHistoryItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as CheckHistoryItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadCheckHistory(): CheckHistoryItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

export function saveCheckToHistory(
  raw: string,
  result: EmailAnalysisResult,
): CheckHistoryItem[] {
  if (typeof window === "undefined") return [];
  const item: CheckHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    preview: raw.replace(/\s+/g, " ").trim().slice(0, 90),
    verdict: result.verdict,
    riskScore: result.riskScore,
    preventionLevel: result.preventionLevel,
    fromEmail: result.technicalFindings.sender.email,
    scamTypes: result.scamType.slice(0, 4),
    result,
  };
  const next = [item, ...loadCheckHistory().filter((h) => h.preview !== item.preview)].slice(
    0,
    MAX,
  );
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearCheckHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function downloadAnalysisReport(
  raw: string,
  result: EmailAnalysisResult,
) {
  const report = {
    product: "ScamShield",
    generatedAt: new Date().toISOString(),
    inputPreview: raw.slice(0, 4000),
    analysis: result,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scamshield-report-${result.verdict}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
