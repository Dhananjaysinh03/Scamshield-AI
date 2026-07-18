export type EvidenceType = "text" | "file";

export type EvidenceItem = {
  id: string;
  type: EvidenceType;
  content: string;
  filename?: string;
  createdAt: string;
};

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Verdict = "scam" | "likely_scam" | "suspicious" | "clean";

export type ThreatCategory =
  | "phishing"
  | "payment_fraud"
  | "malware_lure"
  | "impersonation";

export type MalwareFinding = {
  detected: boolean;
  indicators: string[];
};

export type ScanResult = {
  riskLevel: RiskLevel;
  score: number;
  urls: string[];
  signals: string[];
  summary: string;
  /** Consumer-facing stamp */
  verdict: Verdict;
  /** Plain English for everyday users */
  plainSummary: string;
  /** What to do next (3 short lines) */
  advice: string[];
  categories: ThreatCategory[];
  malware: MalwareFinding;
};

export type ExaMode = "live" | "demo" | "empty";

export type ExaResponse = {
  mode: ExaMode;
  url: string;
  lines: string[];
};

/** Phase 2 — attack timeline */
export type AttackStage =
  | "urgency_escalation"
  | "authority_impersonation"
  | "credential_harvest"
  | "financial_extortion"
  | "unknown";

export type TimelineStage = {
  id: string;
  order: number;
  stage: AttackStage;
  label: string;
  evidenceIds: string[];
  confidence: number;
  rationale: string;
  timestamp: string;
};

export type TimelineResult = {
  stages: TimelineStage[];
  narrative: string;
};

/** Phase 3 — reverse poisoning honeypot */
export type HoneypotStartRequest = {
  targetUrl: string;
  riskLevel: RiskLevel;
  intensity?: "demo" | "burst";
};

export type HoneypotStartResponse = {
  jobId: string;
  mode: "simulated" | "live_sink";
  status: "running" | "done" | "error";
};

export type HoneypotStatusResponse = {
  jobId: string;
  injected: number;
  status: "running" | "done" | "error";
  lastProfilePreview?: string;
  recentProfiles?: string[];
  lines: string[];
};

/** Phase 4 — audio readout */
export type AudioReadoutRequest = {
  text: string;
};

export type AudioReadoutResponse =
  | { mode: "live"; audioBase64: string; mime: string }
  | { mode: "stub"; message: string };

export type OcrResponse = {
  text: string;
  mode: "live" | "stub";
  message?: string;
};
