import type { EvidenceItem } from "@/lib/types";

/** Seed SMS → WhatsApp → fake payment funnel for pitch demos */
export function createDemoFunnel(): EvidenceItem[] {
  const t0 = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      type: "text",
      content:
        "URGENT: Your bank KYC is incomplete. Account will be suspended within 24 hours. Act now to avoid lockdown.",
      createdAt: new Date(t0).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      content:
        "WhatsApp (Bank Security): This is official RBI compliance. Verify your identity on this secure chat. Do not ignore.",
      createdAt: new Date(t0 + 60_000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      content:
        "Final step: Confirm UPI OTP and pay the pending penalty at https://secure-paypa1-login.xyz/otp or face legal action. Send OTP now.",
      createdAt: new Date(t0 + 120_000).toISOString(),
    },
  ];
}
