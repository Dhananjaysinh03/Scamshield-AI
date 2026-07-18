/** Multi-factor email phishing analysis — mentor-defensible JSON contract */

export type EmailVerdict = "safe" | "suspicious" | "phishing";
export type Confidence = "Low" | "Medium" | "High";
export type PreventionLevel = "none" | "caution" | "hard_stop";

export type DangerousIntent =
  | "otp"
  | "payment"
  | "malware_open"
  | "click_verify"
  | "credential_harvest"
  | "wire_ceo"
  | "remote_access"
  | "kyc_harvest"
  | "gift_lure";

export type EmailAnalysisResult = {
  riskScore: number;
  verdict: EmailVerdict;
  confidence: Confidence;
  /** Highest-priority prevention: hard_stop means do not act */
  preventionLevel: PreventionLevel;
  /** Imperative "DO NOT" lines shown first to victims */
  hardStops: string[];
  /** BEC / phishing theme label (Proofpoint-style, plain language) */
  becTheme: string | null;
  /** Short lessons so non-tech users recognize the pattern next time */
  learnHow: string[];
  scamType: string[];
  summary: string;
  plainSummary: string;
  reasons: string[];
  recommendedActions: string[];
  dangerousIntents: DangerousIntent[];
  technicalFindings: {
    sender: {
      displayName: string | null;
      email: string | null;
      domain: string | null;
      replyTo: string | null;
      returnPath: string | null;
      findings: string[];
      score: number;
    };
    content: {
      findings: string[];
      socialEngineering: string[];
      score: number;
    };
    urls: {
      items: {
        url: string;
        https: boolean;
        findings: string[];
      }[];
      score: number;
    };
    attachments: {
      items: { name: string; findings: string[] }[];
      score: number;
    };
    headers: {
      provided: boolean;
      spf: string | null;
      dkim: string | null;
      dmarc: string | null;
      findings: string[];
      score: number;
    };
  };
  weights: {
    sender: number;
    content: number;
    urls: number;
    attachments: number;
    headers: number;
  };
};
