import type { EvidenceItem } from "@/lib/types";

/** Three sequential phishing drops for the 60-second pitch path. */
export function getDemoFunnelEvidence(): EvidenceItem[] {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      type: "text",
      content:
        "SMS from +91-98XXX: URGENT — Your UPI KYC expires in 2 hours. Account will be frozen. Verify now: https://secure-paypa1-kyc.xyz/otp",
      createdAt: new Date(now - 1000 * 60 * 22).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      content:
        "WhatsApp · “HDFC Fraud Desk”: Case ID HDFC-88214. We detected unauthorized login. Confirm OTP with Officer Mehta or your savings account is seized tonight.",
      createdAt: new Date(now - 1000 * 60 * 11).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      content:
        "Final notice: Pay ₹4,999 “security hold release” at https://hdfc-secure-pay.xyz/release or funds transfer out permanently. Do not call bank — ticket already escalated.",
      createdAt: new Date(now - 1000 * 60 * 3).toISOString(),
    },
  ];
}
