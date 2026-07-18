/** Multi-factor email / message analysis — mentor-defensible JSON contract */

export type EmailVerdict = "safe" | "suspicious" | "phishing";
export type Confidence = "Low" | "Medium" | "High";

export type DangerousIntent =
  | "otp"
  | "payment"
  | "malware_open"
  | "click_verify"
  | "credential_harvest"
  | "wire_ceo";

export type EmailAnalysisResult = {
  riskScore: number;
  verdict: EmailVerdict;
  confidence: Confidence;
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
