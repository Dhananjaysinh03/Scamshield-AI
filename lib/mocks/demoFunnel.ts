import type { EvidenceItem } from "@/lib/types";
import { scenarioToEvidence } from "@/lib/mocks/scenarios";

/** @deprecated Prefer scenarioToEvidence('upi_kyc') */
export function getDemoFunnelEvidence(): EvidenceItem[] {
  return scenarioToEvidence("upi_kyc");
}
