import type { RiskLevel, ScanResult } from "./types";

const URL_RE =
  /https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|in|xyz|tk|ml|ga|cf|gq|zip|mov|info|biz)(?:\/[^\s<>"')\]]*)?/gi;

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".zip", ".mov", ".xyz"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly"];
const URGENCY = [
  "immediately",
  "urgent",
  "suspend",
  "within 24 hours",
  "within 24 hrs",
  "act now",
  "final notice",
  "account locked",
  "verify now",
];
const AUTHORITY = [
  "rbi",
  "income tax",
  "kyc",
  "police",
  "customs",
  "bank security",
  "microsoft support",
  "google security",
  "whatsapp",
];
const PAYMENT = [
  "upi",
  "gift card",
  "bitcoin",
  "crypto",
  "wire transfer",
  "otp",
  "cvv",
  "net banking",
];
const BRANDS = [
  "paypal",
  "paytm",
  "phonepe",
  "gpay",
  "sbi",
  "hdfc",
  "icici",
  "amazon",
  "flipkart",
];

function normalizeUrl(raw: string): string {
  const trimmed = raw.replace(/[.,;:!?)]+$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_RE) ?? [];
  const unique = new Set(matches.map(normalizeUrl));
  return [...unique];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function scoreEvidence(texts: string[]): ScanResult {
  const blob = texts.join("\n").toLowerCase();
  const urls = extractUrls(texts.join("\n"));
  const signals: string[] = [];
  let score = 0;

  for (const u of urls) {
    const host = hostOf(u);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      score += 25;
      signals.push(`IP-literal host: ${host}`);
    }
    if (u.startsWith("http://")) {
      score += 10;
      signals.push(`Insecure HTTP: ${host}`);
    }
    if (host.includes("xn--")) {
      score += 20;
      signals.push(`Punycode host: ${host}`);
    }
    for (const tld of SUSPICIOUS_TLDS) {
      if (host.endsWith(tld) || host.includes(tld)) {
        score += 15;
        signals.push(`Suspicious TLD on ${host}`);
        break;
      }
    }
    for (const s of SHORTENERS) {
      if (host === s || host.endsWith(`.${s}`)) {
        score += 12;
        signals.push(`URL shortener: ${host}`);
        break;
      }
    }
    for (const brand of BRANDS) {
      if (host.includes(brand) && !host.endsWith(`${brand}.com`) && !host.endsWith(`${brand}.in`)) {
        score += 22;
        signals.push(`Possible brand impersonation: ${brand} in ${host}`);
        break;
      }
    }
  }

  for (const w of URGENCY) {
    if (blob.includes(w)) {
      score += 8;
      signals.push(`Urgency language: "${w}"`);
    }
  }
  for (const w of AUTHORITY) {
    if (blob.includes(w)) {
      score += 8;
      signals.push(`Authority impersonation: "${w}"`);
    }
  }
  for (const w of PAYMENT) {
    if (blob.includes(w)) {
      score += 10;
      signals.push(`Financial pressure: "${w}"`);
    }
  }

  if (urls.length === 0 && score > 0) {
    score += 5;
    signals.push("Threat language without clear destination URL");
  }
  if (urls.length >= 2) {
    score += 8;
    signals.push("Multiple outbound links in funnel");
  }

  score = Math.max(0, Math.min(100, score));
  const riskLevel = scoreToLevel(score);

  const summary =
    riskLevel === "critical" || riskLevel === "high"
      ? `Elevated phishing risk (${score}/100). ${urls.length} URL(s) flagged with ${signals.length} signal(s).`
      : riskLevel === "medium"
        ? `Moderate risk (${score}/100). Review links and social-engineering cues.`
        : `Low risk (${score}/100). No strong phishing pattern detected.`;

  return {
    riskLevel,
    score,
    urls,
    signals: [...new Set(signals)].slice(0, 12),
    summary,
  };
}
