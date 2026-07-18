import type {
  MalwareFinding,
  RiskLevel,
  ScanResult,
  ThreatCategory,
  Verdict,
} from "./types";

const URL_RE =
  /https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|in|xyz|tk|ml|ga|cf|gq|zip|mov|info|biz|apk)(?:\/[^\s<>"')\]]*)?/gi;

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".zip", ".mov", ".xyz", ".apk"];
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
  "asap",
  "expires",
  "frozen",
  "seized",
  "destroyed",
  "openings close",
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
  "fraud desk",
  "officer",
  "india post",
  "fir",
  "compliance",
  "hdfc",
  "hr",
  "onboarding",
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
  "pay ₹",
  "pay rs",
  "penalty",
  "training kit",
  "clearance",
  "security hold",
  "processing fee",
  "refund fee",
  "share screen",
  "screen share",
  "qr code",
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
  "google",
  "linkedin",
];
const JOB_SCAM = [
  "remote data entry",
  "shortlisted",
  "training kit",
  "first task",
  "aadhaar selfie",
];
const CUSTOMS_SCAM = [
  "parcel is held",
  "smuggling",
  "clearance penalty",
  "international parcel",
];

/** Payload / malware delivery lures — nightmare feature */
const MALWARE_PHRASES = [
  "download apk",
  "install apk",
  "install the app",
  "install app",
  "update chrome",
  "enable macros",
  "open the attachment",
  "run this file",
  "anydesk",
  "teamviewer",
  "ultraviewer",
  "remote access",
  "remote desktop",
  "screen share to verify",
  "install certificate",
  "flash player update",
  "security plugin",
];

const MALWARE_EXT_RE =
  /\.(apk|exe|msi|bat|cmd|scr|vbs|js|jse|wsf|ps1|dmg|iso|jar|com|pif)(\s|$|"|'|\))/i;
const DOUBLE_EXT_RE =
  /\.(pdf|jpg|png|doc|docx|txt|xls|xlsx)\.(exe|scr|bat|cmd|js|apk)/i;

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

function toVerdict(level: RiskLevel, malware: boolean): Verdict {
  if (malware || level === "critical") return "scam";
  if (level === "high") return "likely_scam";
  if (level === "medium") return "suspicious";
  return "clean";
}

function plainCopy(verdict: Verdict, malware: boolean): {
  plainSummary: string;
  advice: string[];
} {
  if (malware) {
    return {
      plainSummary:
        "This looks like a scam that tries to make you install malware or remote-access software. Do not download or open any file.",
      advice: [
        "Do not download APK/EXE or “security update” files.",
        "Do not install AnyDesk / TeamViewer because a stranger asked.",
        "Delete the message and report it as spam.",
      ],
    };
  }
  switch (verdict) {
    case "scam":
      return {
        plainSummary:
          "This looks like a scam. Do not click links, share OTP, or send money.",
        advice: [
          "Do not tap links or QR codes in the message.",
          "Do not share OTP, PIN, or passwords with anyone.",
          "Contact your bank only via the official app or number on your card.",
        ],
      };
    case "likely_scam":
      return {
        plainSummary:
          "This is very likely a scam. Treat it as dangerous until proven otherwise.",
        advice: [
          "Do not pay “fees”, “penalties”, or “KYC unlock” charges.",
          "Do not continue the chat on WhatsApp with “officers”.",
          "Verify independently using official channels.",
        ],
      };
    case "suspicious":
      return {
        plainSummary:
          "This looks suspicious. Be careful — some scam patterns are present.",
        advice: [
          "Pause before clicking or paying.",
          "Check the sender and links carefully.",
          "Ask someone you trust before acting.",
        ],
      };
    default:
      return {
        plainSummary:
          "No strong scam patterns found — still stay careful with links and payments.",
        advice: [
          "If money or OTP is requested, double-check offline.",
          "Prefer official apps over links in messages.",
          "When unsure, don’t engage.",
        ],
      };
  }
}

function detectMalware(blob: string, urls: string[]): MalwareFinding {
  const indicators: string[] = [];

  for (const phrase of MALWARE_PHRASES) {
    if (blob.includes(phrase)) {
      indicators.push(`Phrase lure: "${phrase}"`);
    }
  }

  if (MALWARE_EXT_RE.test(blob) || DOUBLE_EXT_RE.test(blob)) {
    indicators.push("Dangerous file extension / double extension in message");
  }

  for (const u of urls) {
    const lower = u.toLowerCase();
    if (MALWARE_EXT_RE.test(lower) || lower.includes(".apk")) {
      indicators.push(`Payload URL: ${u}`);
    }
  }

  // Wallet / crypto drain often paired with remote tools
  if (
    (blob.includes("anydesk") || blob.includes("teamviewer")) &&
    (blob.includes("otp") || blob.includes("bank") || blob.includes("upi"))
  ) {
    indicators.push("Remote-access tool + banking/OTP pressure");
  }

  return {
    detected: indicators.length > 0,
    indicators: [...new Set(indicators)].slice(0, 8),
  };
}

export function scoreEvidence(texts: string[]): ScanResult {
  const joined = texts.join("\n");
  const blob = joined.toLowerCase();
  const urls = extractUrls(joined);
  const signals: string[] = [];
  const categories = new Set<ThreatCategory>();
  let score = 0;

  const malware = detectMalware(blob, urls);
  if (malware.detected) {
    score += 45;
    categories.add("malware_lure");
    for (const ind of malware.indicators.slice(0, 4)) {
      signals.push(`Malware lure: ${ind}`);
    }
  }

  for (const u of urls) {
    const host = hostOf(u);
    categories.add("phishing");
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
      if (
        host.includes(brand) &&
        !host.endsWith(`${brand}.com`) &&
        !host.endsWith(`${brand}.in`)
      ) {
        score += 22;
        categories.add("impersonation");
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
      categories.add("impersonation");
      signals.push(`Authority impersonation: "${w}"`);
    }
  }
  for (const w of PAYMENT) {
    if (blob.includes(w)) {
      score += 10;
      categories.add("payment_fraud");
      signals.push(`Financial pressure: "${w}"`);
    }
  }
  for (const w of JOB_SCAM) {
    if (blob.includes(w)) {
      score += 12;
      categories.add("payment_fraud");
      signals.push(`Job-scam pattern: "${w}"`);
    }
  }
  for (const w of CUSTOMS_SCAM) {
    if (blob.includes(w)) {
      score += 12;
      categories.add("payment_fraud");
      signals.push(`Customs-scam pattern: "${w}"`);
    }
  }

  // Crypto wallet pattern
  if (/\b(0x[a-f0-9]{40}|bc1[a-z0-9]{20,})\b/i.test(joined)) {
    score += 18;
    categories.add("payment_fraud");
    signals.push("Crypto wallet address present");
  }

  if (urls.length === 0 && score > 0) {
    score += 5;
    signals.push("Threat language without clear destination URL");
  }
  if (urls.length >= 2) {
    score += 8;
    signals.push("Multiple outbound links in funnel");
  }
  if (texts.length >= 3 && score >= 40) {
    score += 10;
    signals.push("Multi-stage evidence funnel (3+ drops)");
  }

  score = Math.max(0, Math.min(100, score));
  const riskLevel = scoreToLevel(score);
  const verdict = toVerdict(riskLevel, malware.detected);
  const { plainSummary, advice } = plainCopy(verdict, malware.detected);

  const summary =
    malware.detected
      ? `MALWARE LURE — critical. ${malware.indicators[0] ?? "Payload delivery patterns detected."}`
      : riskLevel === "critical" || riskLevel === "high"
        ? `Elevated phishing risk (${score}/100). ${urls.length} URL(s), ${signals.length} signal(s).`
        : riskLevel === "medium"
          ? `Moderate risk (${score}/100). Review links and social-engineering cues.`
          : `Low risk (${score}/100). No strong phishing pattern detected.`;

  return {
    riskLevel,
    score,
    urls,
    signals: [...new Set(signals)].slice(0, 14),
    summary,
    verdict,
    plainSummary,
    advice,
    categories: [...categories],
    malware,
  };
}

export function emptyScan(message = "Add text or files before scanning."): ScanResult {
  return {
    riskLevel: "low",
    score: 0,
    urls: [],
    signals: ["No evidence provided"],
    summary: message,
    verdict: "clean",
    plainSummary: "Nothing to check yet — paste a message or try an example.",
    advice: ["Paste the suspicious message.", "Or pick an example below."],
    categories: [],
    malware: { detected: false, indicators: [] },
  };
}
