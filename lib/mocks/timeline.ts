import type { EvidenceItem, TimelineResult } from "@/lib/types";

/** Mock attack timeline — 3 psychological stages for demo / offline FE work. */
export function getMockTimeline(evidence: EvidenceItem[] = []): TimelineResult {
  const ids = evidence.map((e) => e.id);
  const e0 = ids[0] ?? "mock-ev-1";
  const e1 = ids[1] ?? ids[0] ?? "mock-ev-2";
  const e2 = ids[2] ?? ids[1] ?? ids[0] ?? "mock-ev-3";
  const base = Date.now();

  return {
    narrative:
      "Scammer escalated from urgent KYC pressure to authority impersonation, then demanded payment via a forged portal.",
    stages: [
      {
        id: "stage-urgency",
        order: 1,
        stage: "urgency_escalation",
        label: "Urgency Escalation",
        evidenceIds: [e0],
        confidence: 0.92,
        rationale:
          "Language forces immediate action (KYC deadline, account lock) to short-circuit critical thinking.",
        timestamp: new Date(base - 1000 * 60 * 18).toISOString(),
      },
      {
        id: "stage-authority",
        order: 2,
        stage: "authority_impersonation",
        label: "Authority Impersonation",
        evidenceIds: [e1],
        confidence: 0.88,
        rationale:
          "Message claims to be from bank / compliance staff and cites case IDs to borrow institutional trust.",
        timestamp: new Date(base - 1000 * 60 * 9).toISOString(),
      },
      {
        id: "stage-extortion",
        order: 3,
        stage: "financial_extortion",
        label: "Financial Extortion",
        evidenceIds: [e2],
        confidence: 0.95,
        rationale:
          "Victim is steered to a payment / credential harvest link with threats of permanent account loss.",
        timestamp: new Date(base - 1000 * 60 * 2).toISOString(),
      },
    ],
  };
}
