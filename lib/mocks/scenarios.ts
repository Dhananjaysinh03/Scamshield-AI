import type { EvidenceItem } from "@/lib/types";

export type DemoScenarioId = "upi_kyc" | "job_offer" | "customs";

export type DemoScenario = {
  id: DemoScenarioId;
  label: string;
  blurb: string;
  drops: Omit<EvidenceItem, "id" | "createdAt">[];
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "upi_kyc",
    label: "Fake bank / KYC",
    blurb: "“Your account will freeze — click now”",
    drops: [
      {
        type: "text",
        content:
          "SMS from +91-98XXX: URGENT — Your UPI KYC expires in 2 hours. Account will be frozen. Verify now: https://secure-paypa1-kyc.xyz/otp",
      },
      {
        type: "text",
        content:
          "WhatsApp · “HDFC Fraud Desk”: Case ID HDFC-88214. We detected unauthorized login. Confirm OTP with Officer Mehta or your savings account is seized tonight.",
      },
      {
        type: "text",
        content:
          "Final notice: Pay ₹4,999 “security hold release” at https://hdfc-secure-pay.xyz/release or funds transfer out permanently. Do not call bank — ticket already escalated.",
      },
    ],
  },
  {
    id: "job_offer",
    label: "Fake job offer",
    blurb: "“You’re hired — pay a small fee first”",
    drops: [
      {
        type: "text",
        content:
          "LinkedIn DM: Congrats! You are shortlisted for Remote Data Entry @ ₹85k/mo. Reply ASAP — openings close today.",
      },
      {
        type: "text",
        content:
          "WhatsApp HR “Priya (Google Partner)”: Complete onboarding form + upload Aadhaar selfie. Official portal: https://google-hire-onboard.xyz/join",
      },
      {
        type: "text",
        content:
          "Pay ₹2,199 training kit via UPI to unlock first task payout. Gift cards / crypto accepted. Delay = offer cancelled.",
      },
    ],
  },
  {
    id: "customs",
    label: "Fake customs",
    blurb: "“Your parcel is held — pay to release”",
    drops: [
      {
        type: "text",
        content:
          "India Post / Customs: Your international parcel is held for KYC. Clear within 24 hours or item destroyed.",
      },
      {
        type: "text",
        content:
          "Call from “Customs Officer”: Case CUST-441902. Authority verification required. Do not hang up. Portal: https://indiacustoms-clear.xyz/pay",
      },
      {
        type: "text",
        content:
          "Pay clearance penalty ₹7,450 via bitcoin / UPI immediately or face FIR under smuggling clause. OTP sent — share now.",
      },
    ],
  },
];

export function scenarioToEvidence(id: DemoScenarioId): EvidenceItem[] {
  const scenario = DEMO_SCENARIOS.find((s) => s.id === id) ?? DEMO_SCENARIOS[0];
  const now = Date.now();
  return scenario.drops.map((drop, i) => ({
    id: crypto.randomUUID(),
    type: drop.type,
    content: drop.content,
    createdAt: new Date(now - 1000 * 60 * (20 - i * 7)).toISOString(),
  }));
}
