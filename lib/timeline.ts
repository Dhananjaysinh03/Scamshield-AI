import type { AttackStage, EvidenceItem, TimelineResult, TimelineStage } from "./types";

const STAGE_META: Record<
  Exclude<AttackStage, "unknown">,
  { label: string; keywords: string[] }
> = {
  urgency_escalation: {
    label: "Urgency Escalation",
    keywords: [
      "urgent",
      "immediately",
      "within 24",
      "act now",
      "final notice",
      "suspend",
      "locked",
      "expire",
      "asap",
      "hurry",
    ],
  },
  authority_impersonation: {
    label: "Authority Impersonation",
    keywords: [
      "rbi",
      "income tax",
      "kyc",
      "police",
      "customs",
      "bank security",
      "microsoft",
      "google security",
      "whatsapp",
      "official",
      "department",
      "compliance",
    ],
  },
  credential_harvest: {
    label: "Credential Harvest",
    keywords: [
      "password",
      "otp",
      "login",
      "verify",
      "sign in",
      "username",
      "pin",
      "cvv",
      "one-time",
      "credentials",
      "account details",
    ],
  },
  financial_extortion: {
    label: "Financial Extortion",
    keywords: [
      "upi",
      "pay",
      "transfer",
      "bitcoin",
      "crypto",
      "gift card",
      "wire",
      "payment",
      "fine",
      "penalty",
      "refund",
      "amount",
      "rs.",
      "₹",
      "$",
    ],
  },
};

function scoreStages(text: string): { stage: AttackStage; hits: string[]; score: number }[] {
  const lower = text.toLowerCase();
  const scored: { stage: AttackStage; hits: string[]; score: number }[] = [];

  for (const [stage, meta] of Object.entries(STAGE_META) as [
    Exclude<AttackStage, "unknown">,
    (typeof STAGE_META)[Exclude<AttackStage, "unknown">],
  ][]) {
    const hits = meta.keywords.filter((k) => lower.includes(k));
    if (hits.length) {
      scored.push({ stage, hits, score: hits.length });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function classifyDrop(item: EvidenceItem): {
  stage: AttackStage;
  confidence: number;
  rationale: string;
} {
  const scored = scoreStages(item.content);
  if (!scored.length) {
    return {
      stage: "unknown",
      confidence: 0.25,
      rationale: "No strong psychological-attack markers detected in this drop.",
    };
  }

  const top = scored[0];
  const total = scored.reduce((s, x) => s + x.score, 0);
  const confidence = Math.min(0.95, 0.4 + top.score * 0.12 + (top.score / total) * 0.2);
  const label = STAGE_META[top.stage as Exclude<AttackStage, "unknown">]?.label ?? top.stage;

  return {
    stage: top.stage,
    confidence: Number(confidence.toFixed(2)),
    rationale: `Classified as ${label} via signals: ${top.hits.slice(0, 4).join(", ")}.`,
  };
}

/**
 * Map successive evidence drops into a chronological psychological-attack timeline.
 * Consecutive drops with the same stage are merged.
 */
export function buildTimeline(evidence: EvidenceItem[]): TimelineResult {
  if (!evidence.length) {
    return {
      stages: [],
      narrative: "No evidence drops yet. Add SMS / WhatsApp / portal text to stitch a funnel.",
    };
  }

  const ordered = [...evidence].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const raw = ordered.map((item) => ({ item, ...classifyDrop(item) }));

  const merged: TimelineStage[] = [];
  for (const row of raw) {
    const prev = merged[merged.length - 1];
    if (prev && prev.stage === row.stage) {
      prev.evidenceIds.push(row.item.id);
      prev.confidence = Number(
        Math.min(0.98, (prev.confidence + row.confidence) / 2 + 0.05).toFixed(2),
      );
      prev.rationale = `${prev.rationale} Merged follow-up drop.`;
      prev.timestamp = row.item.createdAt;
      continue;
    }

    const label =
      row.stage === "unknown"
        ? "Unclassified Probe"
        : STAGE_META[row.stage].label;

    merged.push({
      id: `stage-${merged.length + 1}-${row.item.id.slice(0, 8)}`,
      order: merged.length + 1,
      stage: row.stage,
      label,
      evidenceIds: [row.item.id],
      confidence: row.confidence,
      rationale: row.rationale,
      timestamp: row.item.createdAt,
    });
  }

  const labels = merged.map((s) => s.label).join(" -> ");
  const narrative =
    merged.length === 1
      ? `Single-stage signal: ${merged[0].label}. Add more drops to reveal the full funnel.`
      : `Multi-stage funnel detected (${merged.length} phases): ${labels}.`;

  return { stages: merged, narrative };
}
