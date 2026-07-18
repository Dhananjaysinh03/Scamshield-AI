import { parseEmail } from "@/lib/email/parse";
import type {
  Confidence,
  DangerousIntent,
  EmailAnalysisResult,
  EmailVerdict,
  PreventionLevel,
} from "@/lib/email/types";

const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com",
  "yandex.com",
  "gmx.com",
  "rediffmail.com",
  "zoho.com",
]);

const SUSPICIOUS_TLDS = [
  ".tk",
  ".ml",
  ".ga",
  ".cf",
  ".gq",
  ".zip",
  ".mov",
  ".xyz",
  ".top",
  ".buzz",
  ".click",
  ".icu",
  ".rest",
  ".country",
  ".cfd",
  ".sbs",
  ".cyou",
];

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "cutt.ly",
  "rebrand.ly",
  "rb.gy",
  "shorturl.at",
];

const DANGER_EXT =
  /\.(exe|scr|js|jse|vbs|bat|cmd|com|pif|docm|xlsm|iso|apk|jar|ps1|wsf|msi|dmg|hta)$/i;
const DOUBLE_EXT =
  /\.(pdf|jpg|png|doc|docx|txt|xls|xlsx|html?)\.(exe|scr|bat|cmd|js|apk|msi)/i;

const BRANDS = [
  "paypal",
  "microsoft",
  "apple",
  "google",
  "amazon",
  "netflix",
  "hdfc",
  "sbi",
  "icici",
  "axis",
  "kotak",
  "paytm",
  "phonepe",
  "gpay",
  "facebook",
  "instagram",
  "whatsapp",
  "flipkart",
  "myntra",
  "irctc",
  "uidai",
  "incometax",
];

const OFFICIAL_BRAND_HOST: Record<string, string[]> = {
  paypal: ["paypal.com"],
  microsoft: ["microsoft.com", "live.com", "office.com", "outlook.com"],
  apple: ["apple.com", "icloud.com"],
  google: ["google.com", "gmail.com", "googlemail.com"],
  amazon: ["amazon.com", "amazon.in", "amazonaws.com"],
  netflix: ["netflix.com"],
  hdfc: ["hdfcbank.com", "hdfcbank.net"],
  sbi: ["sbi.co.in", "onlinesbi.sbi", "sbi.in"],
  icici: ["icicibank.com"],
  axis: ["axisbank.com"],
  kotak: ["kotak.com"],
  paytm: ["paytm.com"],
  phonepe: ["phonepe.com"],
  gpay: ["google.com", "gpay.app.goo.gl"],
  facebook: ["facebook.com", "fb.com", "meta.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com", "whatsapp.net"],
  flipkart: ["flipkart.com"],
  myntra: ["myntra.com"],
  irctc: ["irctc.co.in"],
  uidai: ["uidai.gov.in"],
  incometax: ["incometax.gov.in"],
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function brandInText(text: string): string | null {
  const t = text.toLowerCase();
  for (const b of BRANDS) {
    if (t.includes(b)) return b;
  }
  return null;
}

function isOfficialHost(brand: string, host: string): boolean {
  const allowed = OFFICIAL_BRAND_HOST[brand] || [`${brand}.com`, `${brand}.in`];
  return allowed.some(
    (d) => host === d || host.endsWith(`.${d}`) || host.endsWith(d),
  );
}

function analyzeSender(
  parsed: ReturnType<typeof parseEmail>,
  officialDomain?: string,
): { findings: string[]; score: number; scamTypes: string[] } {
  const findings: string[] = [];
  const scamTypes: string[] = [];
  let score = 0;
  const { displayName, fromEmail, fromDomain, replyTo, returnPath } = parsed;

  if (!fromEmail && !fromDomain) {
    findings.push(
      "No clear From address — treat carefully (incomplete email paste).",
    );
    return { findings, score: 15, scamTypes };
  }

  if (fromDomain && FREE_MAIL.has(fromDomain)) {
    const name = (displayName || "").toLowerCase();
    const mailLocal = (fromEmail || "").split("@")[0] || "";
    const corpHints = [
      "ceo",
      "cfo",
      "hr",
      "payroll",
      "director",
      "president",
      "bank",
      "support",
      "officer",
      "admin",
      "security",
      "fraud",
      "compliance",
      "finance",
      "accounts",
    ];
    if (
      corpHints.some((h) => name.includes(h) || mailLocal.includes(h)) ||
      brandInText(name || "")
    ) {
      score += 60;
      findings.push(
        `Free email (${fromDomain}) used with a corporate / brand-looking name — classic executive or bank impersonation.`,
      );
      scamTypes.push("Executive Impersonation");
    } else {
      score += 10;
      findings.push(
        `Sender uses a free mailbox (${fromDomain}). Not proof of fraud alone.`,
      );
    }
  }

  // Display name claims a brand but From domain is not official
  const brandInName = brandInText(displayName || "");
  if (brandInName && fromDomain && !isOfficialHost(brandInName, fromDomain)) {
    score += 50;
    findings.push(
      `Display name suggests “${brandInName}” but From domain is ${fromDomain} — brand spoof.`,
    );
    scamTypes.push("Brand Spoof");
  }

  if (officialDomain && fromDomain) {
    const official = officialDomain.replace(/^@/, "").toLowerCase();
    if (fromDomain !== official && !fromDomain.endsWith(`.${official}`)) {
      score += 45;
      findings.push(
        `Sender domain (${fromDomain}) does not match official domain (${official}).`,
      );
      scamTypes.push("Domain Spoofing");
    }
  }

  if (fromDomain) {
    for (const brand of BRANDS) {
      if (
        fromDomain.includes(brand) &&
        !isOfficialHost(brand, fromDomain) &&
        !FREE_MAIL.has(fromDomain)
      ) {
        score += 50;
        findings.push(
          `Possible brand typosquat in sender domain: ${fromDomain}`,
        );
        scamTypes.push("Typosquatting");
        break;
      }
      const lookalike: string = fromDomain
        .replace(/0/g, "o")
        .replace(/1/g, "l")
        .replace(/3/g, "e")
        .replace(/5/g, "s");
      if (lookalike.includes(brand) && fromDomain !== lookalike) {
        score += 40;
        findings.push(
          `Lookalike characters in domain (e.g. 0/O, 1/l): ${fromDomain}`,
        );
        scamTypes.push("Typosquatting");
        break;
      }
    }
  }

  if (replyTo && fromEmail && replyTo.toLowerCase() !== fromEmail.toLowerCase()) {
    const replyDom = replyTo.split("@")[1]?.toLowerCase();
    if (replyDom && fromDomain && replyDom !== fromDomain) {
      score += 35;
      findings.push(
        `Reply-To (${replyTo}) differs from From (${fromEmail}) — replies may go to an attacker.`,
      );
      scamTypes.push("Reply-To Mismatch");
    }
  }

  if (returnPath && fromDomain && !returnPath.includes(fromDomain)) {
    score += 20;
    findings.push("Return-Path domain does not align with From domain.");
  }

  return { findings, score: clamp(score), scamTypes };
}

function analyzeContent(
  body: string,
  subject: string | null,
): {
  findings: string[];
  social: string[];
  score: number;
  intents: DangerousIntent[];
  scamTypes: string[];
} {
  const text = `${subject || ""}\n${body}`.toLowerCase();
  const findings: string[] = [];
  const social: string[] = [];
  const intents: DangerousIntent[] = [];
  const scamTypes: string[] = [];
  let score = 0;

  const checks: {
    keys: string[];
    intent?: DangerousIntent;
    finding: string;
    socialLabel: string;
    pts: number;
    type?: string;
  }[] = [
    {
      keys: [
        "otp",
        "one-time password",
        "one time password",
        "verification code",
        "enter the code",
        "share the otp",
        "send the otp",
        "confirm otp",
      ],
      intent: "otp",
      finding:
        "Asks for an OTP / verification code — banks never need this by email.",
      socialLabel: "Fear + trust: steal the code that unlocks your account",
      pts: 40,
      type: "OTP Harvest",
    },
    {
      keys: [
        "password",
        "login credentials",
        "confirm your password",
        "account password",
        "pin number",
        "cvv",
        "card number",
        "debit card",
        "net banking password",
      ],
      intent: "credential_harvest",
      finding: "Requests a password, PIN, CVV, or card details.",
      socialLabel: "Authority: pretend to be support to steal access",
      pts: 40,
      type: "Credential Harvest",
    },
    {
      keys: [
        "wire transfer",
        "gift card",
        "buy itunes",
        "bitcoin",
        "crypto wallet",
        "upi",
        "pay now",
        "send money",
        "invoice attached",
        "overdue invoice",
        "neft",
        "rtgs",
        "imps",
        "scan qr",
        "qr code to pay",
      ],
      intent: "payment",
      finding: "Pushes a payment, gift card, crypto, UPI, or QR pay action.",
      socialLabel: "Financial pressure",
      pts: 35,
      type: "Payment / Invoice Fraud",
    },
    {
      keys: [
        "ceo",
        "urgent wire",
        "as discussed",
        "keep this confidential",
        "do not tell",
        "don't tell anyone",
        "i need you to process",
        "before eod",
      ],
      intent: "wire_ceo",
      finding: "Looks like CEO / payroll fraud language.",
      socialLabel: "Authority + secrecy",
      pts: 45,
      type: "CEO Fraud",
    },
    {
      keys: [
        "click here",
        "verify your account",
        "update your kyc",
        "confirm your identity",
        "login to continue",
        "secure login",
        "re-activate",
        "reactivate",
      ],
      intent: "click_verify",
      finding:
        "Pushes you to click a verify/login link instead of using your official app.",
      socialLabel: "Urgency + trust exploitation",
      pts: 28,
      type: "Phishing Link",
    },
    {
      keys: [
        "aadhaar",
        "aadhar",
        "pan card",
        "kyc update",
        "kyc pending",
        "complete kyc",
        "re-kyc",
        "uidai",
      ],
      intent: "kyc_harvest",
      finding:
        "Pushes KYC / Aadhaar / PAN update via email — often identity theft bait.",
      socialLabel: "Fear of account freeze + official language",
      pts: 35,
      type: "KYC / ID Harvest",
    },
    {
      keys: [
        "anydesk",
        "teamviewer",
        "ultraviewer",
        "remote access",
        "share your screen",
        "screen sharing",
        "install remote",
        "allow remote",
        "customer care executive",
      ],
      intent: "remote_access",
      finding:
        "Asks for remote access / screen share — classic takeover path for draining accounts.",
      socialLabel: "Trust + fake support",
      pts: 55,
      type: "Remote Access Fraud",
    },
    {
      keys: [
        "account will be closed",
        "suspended",
        "legal action",
        "within 24 hours",
        "immediately",
        "final notice",
        "act now",
        "will be frozen",
        "account freeze",
      ],
      finding: "Uses urgency / threat language to rush you.",
      socialLabel: "Urgency + fear",
      pts: 18,
      type: "Social Engineering",
    },
    {
      keys: ["hr department", "payroll update", "direct deposit", "salary credit"],
      finding: "Possible HR / payroll impersonation.",
      socialLabel: "Authority (HR)",
      pts: 22,
      type: "HR Impersonation",
    },
  ];

  for (const c of checks) {
    if (c.keys.some((k) => text.includes(k))) {
      score += c.pts;
      findings.push(c.finding);
      social.push(c.socialLabel);
      if (c.intent) intents.push(c.intent);
      if (c.type) scamTypes.push(c.type);
    }
  }

  return {
    findings: [...new Set(findings)],
    social: [...new Set(social)],
    score: clamp(score),
    intents: [...new Set(intents)],
    scamTypes: [...new Set(scamTypes)],
  };
}

function analyzeUrls(urls: string[]): {
  items: { url: string; https: boolean; findings: string[] }[];
  score: number;
  scamTypes: string[];
  brandSpoofUrl: boolean;
} {
  const items: { url: string; https: boolean; findings: string[] }[] = [];
  const scamTypes: string[] = [];
  let worst = 0;
  let brandSpoofUrl = false;

  for (const url of urls.slice(0, 12)) {
    const findings: string[] = [];
    let local = 0;
    const https = url.startsWith("https://");
    const host = hostOf(url);

    if (host.includes("xn--")) {
      local += 50;
      findings.push(
        "Punycode / internationalized domain (xn--) — often used to spoof brands.",
      );
      scamTypes.push("Homograph URL");
    }

    if (!https) {
      local += 22;
      findings.push("Link is not HTTPS — easier to intercept.");
    }
    for (const tld of SUSPICIOUS_TLDS) {
      if (host.endsWith(tld)) {
        local += 40;
        findings.push(
          `Suspicious TLD (${tld}) — often used in phishing kits.`,
        );
        scamTypes.push("Suspicious Link");
        break;
      }
    }
    for (const s of SHORTENERS) {
      if (host === s || host.endsWith(`.${s}`)) {
        local += 30;
        findings.push("Shortened URL hides the real destination.");
        scamTypes.push("Hidden Link");
        break;
      }
    }
    for (const brand of BRANDS) {
      if (host.includes(brand) && !isOfficialHost(brand, host)) {
        local += 50;
        brandSpoofUrl = true;
        findings.push(
          `Brand name in a non-official domain (${host}) — likely fake login.`,
        );
        scamTypes.push("Typosquatting URL");
        break;
      }
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      local += 45;
      findings.push(
        "Link uses a raw IP address instead of a normal website name.",
      );
    }
    if (
      host.split(".").length >= 4 &&
      /secure|login|verify|account|update|support/i.test(host)
    ) {
      local += 25;
      findings.push(
        "Long subdomain with login/verify wording — common phishing pattern.",
      );
    }
    if (DANGER_EXT.test(url) || url.toLowerCase().includes(".apk")) {
      local += 50;
      findings.push(
        "URL points at a downloadable program/APK — high malware risk.",
      );
      scamTypes.push("Malware Delivery");
    }

    if (findings.length === 0) {
      findings.push("No strong URL red flags from static rules alone.");
    }

    items.push({ url, https, findings });
    worst = Math.max(worst, local);
  }

  if (urls.length === 0) {
    return { items: [], score: 0, scamTypes, brandSpoofUrl: false };
  }

  return {
    items,
    score: clamp(worst),
    scamTypes: [...new Set(scamTypes)],
    brandSpoofUrl,
  };
}

function analyzeAttachments(names: string[]): {
  items: { name: string; findings: string[] }[];
  score: number;
  intents: DangerousIntent[];
  scamTypes: string[];
} {
  const items: { name: string; findings: string[] }[] = [];
  const scamTypes: string[] = [];
  const intents: DangerousIntent[] = [];
  let worst = 0;

  for (const name of names) {
    const findings: string[] = [];
    let local = 0;
    const lower = name.toLowerCase();

    if (DANGER_EXT.test(lower)) {
      local += 75;
      findings.push("Dangerous file type that can run code on your device.");
      intents.push("malware_open");
      scamTypes.push("Malware Attachment");
    }
    if (DOUBLE_EXT.test(lower)) {
      local += 80;
      findings.push(
        "Double extension (e.g. invoice.pdf.exe) — classic malware trick.",
      );
      intents.push("malware_open");
      scamTypes.push("Malware Attachment");
    }
    if (/\.(zip|rar|7z|iso)$/i.test(lower)) {
      local += 40;
      findings.push(
        "Archive / disk image — often used to hide malware or password-protected payloads.",
      );
      scamTypes.push("Suspicious Archive");
    }
    if (/\.(docm|xlsm)$/i.test(lower)) {
      local += 60;
      findings.push("Macro-enabled Office file — common malware dropper.");
      intents.push("malware_open");
      scamTypes.push("Macro Malware");
    }
    if (/\.(html?|htm)$/i.test(lower)) {
      local += 35;
      findings.push(
        "HTML attachment can open a fake login page offline — treat as phishing lure.",
      );
      scamTypes.push("HTML Phish Attachment");
    }
    if (/invoice|payment|receipt|resume|kyc|statement/i.test(lower) && local > 0) {
      findings.push(
        "Filename pretends to be a business/ID document while carrying a dangerous type.",
      );
    }
    if (findings.length === 0) {
      findings.push("Attachment name alone is not clearly dangerous.");
    } else {
      worst = Math.max(worst, local);
    }
    items.push({ name, findings });
  }

  return {
    items,
    score: clamp(worst),
    intents: [...new Set(intents)],
    scamTypes: [...new Set(scamTypes)],
  };
}

function analyzeHeaders(parsed: ReturnType<typeof parseEmail>): {
  findings: string[];
  score: number;
  provided: boolean;
} {
  if (!parsed.hasHeaderBlock) {
    return {
      provided: false,
      score: 0,
      findings: [
        "Email headers (SPF/DKIM/DMARC) were not provided — score does not assume pass or fail. Paste full .eml for header checks.",
      ],
    };
  }

  const findings: string[] = [];
  let score = 0;
  const failish = (v: string | null) =>
    v && ["FAIL", "SOFTFAIL", "NEUTRAL", "NONE"].includes(v);

  if (failish(parsed.spf)) {
    score += 45;
    findings.push(
      `SPF ${parsed.spf} — server may not be allowed to send as this domain.`,
    );
  } else if (parsed.spf === "PASS") {
    findings.push(
      "SPF PASS — domain authorizes this sending path (not a full guarantee of safety).",
    );
  }

  if (failish(parsed.dkim)) {
    score += 40;
    findings.push(`DKIM ${parsed.dkim} — message signature check did not pass.`);
  } else if (parsed.dkim === "PASS") {
    findings.push("DKIM PASS — content signature looks valid.");
  }

  if (failish(parsed.dmarc)) {
    score += 45;
    findings.push(`DMARC ${parsed.dmarc} — domain policy check failed.`);
  } else if (parsed.dmarc === "PASS") {
    findings.push("DMARC PASS — aligns with domain policy.");
  }

  if (!parsed.spf && !parsed.dkim && !parsed.dmarc) {
    findings.push(
      "Headers present but SPF/DKIM/DMARC results not found in paste.",
    );
    score += 12;
  }

  return { provided: true, findings, score: clamp(score) };
}

function hardStopsFor(intents: DangerousIntent[]): string[] {
  const stops: string[] = [];
  if (intents.includes("otp") || intents.includes("credential_harvest")) {
    stops.push("DO NOT share OTP, passwords, PIN, CVV, or card numbers.");
  }
  if (intents.includes("payment") || intents.includes("wire_ceo")) {
    stops.push(
      "DO NOT pay, wire money, buy gift cards, or scan a QR from this email.",
    );
  }
  if (intents.includes("malware_open")) {
    stops.push("DO NOT open, download, or run any attachment or linked file.");
  }
  if (intents.includes("click_verify") || intents.includes("kyc_harvest")) {
    stops.push(
      "DO NOT tap verify / KYC links — open your bank or gov app yourself.",
    );
  }
  if (intents.includes("remote_access")) {
    stops.push(
      "DO NOT install AnyDesk/TeamViewer or share your screen with “support”.",
    );
  }
  if (stops.length === 0) {
    stops.push("DO NOT click unexpected links until you verify the sender.");
  }
  stops.push("If money or access is at risk: stop and call a trusted person.");
  return [...new Set(stops)];
}

function actionsFor(
  verdict: EmailVerdict,
  intents: DangerousIntent[],
): string[] {
  const actions = new Set<string>();
  if (verdict === "safe") {
    actions.add("Still avoid odd links if you weren’t expecting this email.");
    actions.add("Prefer official apps/websites you type yourself.");
    return [...actions];
  }
  actions.add("Delete or archive this email after you screenshot it for proof.");
  actions.add("Report as phishing in your mail app if available.");
  if (intents.includes("otp") || intents.includes("credential_harvest")) {
    actions.add(
      "If you already shared an OTP/password — change it now and call your bank.",
    );
  }
  if (intents.includes("payment") || intents.includes("wire_ceo")) {
    actions.add(
      "Confirm any payment request by calling a known number — never the one in the email.",
    );
  }
  if (intents.includes("malware_open")) {
    actions.add(
      "If you opened a file: disconnect Wi‑Fi, run antivirus, and get help.",
    );
  }
  if (intents.includes("remote_access")) {
    actions.add(
      "If remote access was granted: uninstall it, change passwords, check bank apps.",
    );
  }
  actions.add("Show this result to someone you trust before doing anything else.");
  return [...actions];
}

/**
 * Irreversible-action brake: if the email tries to make you do something
 * you cannot undo, force a hard stop even when weighted score is mid-range.
 */
function applyPreventionFloor(
  riskScore: number,
  verdict: EmailVerdict,
  confidence: Confidence,
  intents: DangerousIntent[],
  senderScore: number,
  urlScore: number,
  attachmentScore: number,
  brandSpoofUrl: boolean,
): {
  riskScore: number;
  verdict: EmailVerdict;
  confidence: Confidence;
  preventionLevel: PreventionLevel;
  forced: boolean;
} {
  const irreversible = intents.some((i) =>
    [
      "otp",
      "payment",
      "malware_open",
      "credential_harvest",
      "wire_ceo",
      "remote_access",
      "kyc_harvest",
    ].includes(i),
  );

  let nextScore = riskScore;
  let nextVerdict = verdict;
  let nextConfidence = confidence;
  let forced = false;

  // Absolute: malware delivery
  if (intents.includes("malware_open") || attachmentScore >= 70) {
    nextScore = Math.max(nextScore, 90);
    nextVerdict = "phishing";
    nextConfidence = "High";
    forced = true;
  }

  // OTP / credentials + spoofed brand link or bad sender
  if (
    (intents.includes("otp") || intents.includes("credential_harvest")) &&
    (brandSpoofUrl || urlScore >= 40 || senderScore >= 45)
  ) {
    nextScore = Math.max(nextScore, 88);
    nextVerdict = "phishing";
    nextConfidence = "High";
    forced = true;
  }

  // CEO wire on free mail or mismatched domain
  if (intents.includes("wire_ceo") && senderScore >= 40) {
    nextScore = Math.max(nextScore, 85);
    nextVerdict = "phishing";
    nextConfidence = "High";
    forced = true;
  }

  // Remote access is always a hard stop
  if (intents.includes("remote_access")) {
    nextScore = Math.max(nextScore, 92);
    nextVerdict = "phishing";
    nextConfidence = "High";
    forced = true;
  }

  // KYC harvest + urgency/link
  if (intents.includes("kyc_harvest") && (urlScore >= 30 || brandSpoofUrl)) {
    nextScore = Math.max(nextScore, 82);
    nextVerdict = "phishing";
    nextConfidence = nextConfidence === "Low" ? "Medium" : nextConfidence;
    forced = true;
  }

  // Payment + suspicious URL
  if (intents.includes("payment") && urlScore >= 35) {
    nextScore = Math.max(nextScore, 78);
    if (nextVerdict === "safe") nextVerdict = "suspicious";
    if (nextScore >= 70) nextVerdict = "phishing";
    forced = true;
  }

  let preventionLevel: PreventionLevel = "none";
  if (nextVerdict === "phishing" || (irreversible && nextVerdict !== "safe")) {
    preventionLevel = "hard_stop";
  } else if (nextVerdict === "suspicious" || irreversible) {
    preventionLevel = "caution";
  }

  if (irreversible && nextVerdict === "safe") {
    nextVerdict = "suspicious";
    nextScore = Math.max(nextScore, 45);
    preventionLevel = "hard_stop";
    forced = true;
  }

  return {
    riskScore: clamp(nextScore),
    verdict: nextVerdict,
    confidence: nextConfidence,
    preventionLevel,
    forced,
  };
}

function verdictFromScore(
  score: number,
  strongEvidence: boolean,
): { verdict: EmailVerdict; confidence: Confidence } {
  if (score >= 70 && strongEvidence) {
    return { verdict: "phishing", confidence: score >= 85 ? "High" : "Medium" };
  }
  if (score >= 70 && !strongEvidence) {
    return { verdict: "suspicious", confidence: "Medium" };
  }
  if (score >= 35) {
    return {
      verdict: "suspicious",
      confidence: score >= 55 ? "Medium" : "Low",
    };
  }
  return { verdict: "safe", confidence: score <= 15 ? "Medium" : "Low" };
}

/**
 * Multi-factor email phishing analysis with irreversible-action prevention floor.
 */
export function analyzeEmailRaw(
  raw: string,
  options?: { officialDomain?: string },
): EmailAnalysisResult {
  const parsed = parseEmail(raw);
  const sender = analyzeSender(parsed, options?.officialDomain);
  const content = analyzeContent(parsed.body, parsed.subject);
  const urls = analyzeUrls(parsed.urls);
  const attachments = analyzeAttachments(parsed.attachments);
  const headers = analyzeHeaders(parsed);

  const weights = {
    sender: 0.25,
    content: 0.2,
    urls: 0.2,
    attachments: 0.2,
    headers: headers.provided ? 0.15 : 0,
  };

  const wSum =
    weights.sender +
    weights.content +
    weights.urls +
    weights.attachments +
    weights.headers;
  let riskScore = clamp(
    (sender.score * weights.sender +
      content.score * weights.content +
      urls.score * weights.urls +
      attachments.score * weights.attachments +
      headers.score * weights.headers) /
      (wSum || 1),
  );

  const strongEvidence =
    sender.score >= 40 ||
    attachments.score >= 50 ||
    urls.score >= 40 ||
    content.intents.length >= 2 ||
    (headers.provided && headers.score >= 40);

  let { verdict, confidence } = verdictFromScore(riskScore, strongEvidence);
  const intents = [
    ...new Set([...content.intents, ...attachments.intents]),
  ];

  const floor = applyPreventionFloor(
    riskScore,
    verdict,
    confidence,
    intents,
    sender.score,
    urls.score,
    attachments.score,
    urls.brandSpoofUrl,
  );
  riskScore = floor.riskScore;
  verdict = floor.verdict;
  confidence = floor.confidence;

  const scamType = [
    ...new Set([
      ...sender.scamTypes,
      ...content.scamTypes,
      ...urls.scamTypes,
      ...attachments.scamTypes,
    ]),
  ];

  const reasons = [
    ...sender.findings.filter((f) => !f.includes("Not proof of fraud alone")),
    ...content.findings,
    ...urls.items.flatMap((u) =>
      u.findings.filter((f) => !f.includes("No strong URL")),
    ),
    ...attachments.items.flatMap((a) =>
      a.findings.filter((f) => !f.includes("not clearly dangerous")),
    ),
    ...(headers.provided
      ? headers.findings.filter((f) => /fail|softfail|not/i.test(f))
      : []),
  ].slice(0, 10);

  if (floor.forced) {
    reasons.unshift(
      "Irreversible-action brake: this email asks you to do something you cannot undo (OTP / pay / open file / remote access).",
    );
  }

  const hardStops =
    floor.preventionLevel === "none" ? [] : hardStopsFor(intents);

  const plainSummary =
    verdict === "phishing"
      ? "PHISHING — stop now. Do not click, pay, share OTP, open files, or allow remote access."
      : verdict === "suspicious"
        ? "Suspicious — do not act until you verify through an official channel you already trust."
        : "No strong multi-factor phishing signals — still stay careful with unexpected links.";

  const summary =
    verdict === "phishing"
      ? `Phishing likely (score ${riskScore}/100). Prevention level: HARD STOP.`
      : verdict === "suspicious"
        ? `Suspicious (score ${riskScore}/100). Pause before any irreversible step.`
        : `Safe-leaning (score ${riskScore}/100). Low combined risk across factors.`;

  return {
    riskScore,
    verdict,
    confidence,
    preventionLevel: floor.preventionLevel,
    hardStops,
    scamType,
    summary,
    plainSummary,
    reasons: reasons.length
      ? reasons
      : ["Insufficient strong signals across factors — staying cautious."],
    recommendedActions: actionsFor(verdict, intents),
    dangerousIntents: intents,
    technicalFindings: {
      sender: {
        displayName: parsed.displayName,
        email: parsed.fromEmail,
        domain: parsed.fromDomain,
        replyTo: parsed.replyTo,
        returnPath: parsed.returnPath,
        findings: sender.findings,
        score: sender.score,
      },
      content: {
        findings: content.findings,
        socialEngineering: content.social,
        score: content.score,
      },
      urls: {
        items: urls.items,
        score: urls.score,
      },
      attachments: {
        items: attachments.items,
        score: attachments.score,
      },
      headers: {
        provided: headers.provided,
        spf: parsed.spf,
        dkim: parsed.dkim,
        dmarc: parsed.dmarc,
        findings: headers.findings,
        score: headers.score,
      },
    },
    weights: {
      sender: 25,
      content: 20,
      urls: 20,
      attachments: 20,
      headers: headers.provided ? 15 : 0,
    },
  };
}
