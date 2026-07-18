export type EvidenceType = "text" | "file";

export type EvidenceItem = {
  id: string;
  type: EvidenceType;
  content: string;
  filename?: string;
  createdAt: string;
};

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ScanResult = {
  riskLevel: RiskLevel;
  score: number;
  urls: string[];
  signals: string[];
  summary: string;
};

export type ExaMode = "live" | "demo" | "empty";

export type ExaResponse = {
  mode: ExaMode;
  url: string;
  lines: string[];
};
