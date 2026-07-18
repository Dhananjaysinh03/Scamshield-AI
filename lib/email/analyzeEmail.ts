import { parseEmail } from "@/lib/email/parse";
import type {
  Confidence,
  DangerousIntent,
  EmailAnalysisResult,
  EmailVerdict,
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
]);

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".zip", ".mov", ".xyz", ".top", ".buzz", ".click"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "rebrand.ly"];
const DANGER_EXT =
  /\.(exe|scr|js|jse|vbs|bat|cmd|com|pif|docm|xlsm|iso|apk|jar|ps1|wsf)$/i;
const DOUBLE_EXT = /\.(pdf|jpg|png|doc|docx|txt|xls|xlsx)\.(exe|scr|bat|cmd|js|apk)/i;

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
  "paytm",
  "phonepe",
  "facebook",
  "instagram",
  "whatsapp",
];

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

function analyzeSender(
  parsed: ReturnType<typeof parseEmail>,
  officialDomain?: string,
): { findings: string[]; score: number; scamTypes: string[] } {
  const findings: string[] = [];
  const scamTypes: string[] = [];
  let score = 0;
  const { displayName, fromEmail, fromDomain, replyTo, returnPath } = parsed;

  if (!fromEmail && !fromDomain) {
    findings.push("No clear From address — treat carefully (incomplete email paste).");
    return { findings, score: 15, scamTypes };
  }

  if (fromDomain && FREE_MAIL.has(fromDomain)) {
    const name = (displayName || "").toLowerCase();
    const corpHints = ["ceo", "cfo", "hr", "payroll", "director", "president", "bank", "support", "officer", "admin"];
    if (corpHints.some((h) => name.includes(h) || (fromEmail || "").includes(h))) {
      score += 55;
      findings.push(
        `Free email (${fromDomain}) used with a corporate-looking name — classic executive / support impersonation.`,
      );
      scamTypes.push("Executive Impersonation");
    } else {
      score += 10;
      findings.push(`Sender uses a free mailbox (${fromDomain}). Not proof of fraud alone.`);
    }
  }

  if (officialDomain && fromDomain) {
    const official = officialDomain.replace(/^@/, "").toLowerCase();
    if (fromDomain !== official && !fromDomain.endsWith(`.${official}`)) {
      score += 40;
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
        !fromDomain.endsWith(`${brand}.com`) &&
        !fromDomain.endsWith(`${brand}.in`) &&
        !FREE_MAIL.has(fromDomain)
      ) {
        score += 45;
        findings.push(`Possible brand typosquat in sender domain: ${fromDomain}`);
        scamTypes.push("Typosquatting");
        break;
      }
      // lookalike digits
      const lookalike: string = fromDomain.replace(/0/g, "o").replace(/1/g, "l");
      if (lookalike.includes(brand) && fromDomain !== lookalike) {
        score += 35;
        findings.push(`Lookalike characters in domain (e.g. 0/O): ${fromDomain}`);
        scamTypes.push("Typosquatting");
        break;
      }
    }
  }

  if (replyTo && fromEmail && replyTo.toLowerCase() !== fromEmail.toLowerCase()) {
    const replyDom = replyTo.split("@")[1];
    if (replyDom && fromDomain && replyDom !== fromDomain) {
      score += 30;
      findings.push(
        `Reply-To (${replyTo}) differs from From (${fromEmail}) — replies may go to an attacker.`,
      );
      scamTypes.push("Reply-To Mismatch");
    }
  }

  if (returnPath && fromEmail && !returnPath.includes(fromDomain || "___")) {
    score += 15;
    findings.push("Return-Path domain does not align with From domain.");
  }

  return { findings, score: clamp(score), scamTypes };
}

function analyzeContent(body: string, subject: string | null): {
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

  const checks: { keys: string[]; intent?: DangerousIntent; finding: string; socialLabel: string; pts: number; type?: string }[] = [
    { keys: ["otp", "one-time password", "one time password", "verification code"], intent: "otp", finding: "Asks for an OTP / verification code — banks never need this by email or chat.", socialLabel: "Fear + trust: steal the code that unlocks your account", pts: 35, type: "OTP Harvest" },
    { keys: ["password", "login credentials", "confirm your password", "account password"], intent: "credential_harvest", finding: "Requests a password or login credentials.", socialLabel: "Authority: pretend to be support to steal access", pts: 35, type: "Credential Harvest" },
    { keys: ["wire transfer", "gift card", "buy itunes", "bitcoin", "crypto wallet", "upi", "pay now", "send money", "invoice attached", "overdue invoice"], intent: "payment", finding: "Pushes a payment, gift card, crypto, or UPI action.", socialLabel: "Financial pressure", pts: 30, type: "Payment / Invoice Fraud" },
    { keys: ["ceo", "urgent wire", "as discussed", "keep this confidential", "do not tell"], intent: "wire_ceo", finding: "Looks like CEO / payroll fraud language.", socialLabel: "Authority + secrecy", pts: 40, type: "CEO Fraud" },
    { keys: ["click here", "verify your account", "update your kyc", "confirm your identity", "login to continue"], intent: "click_verify", finding: "Pushes you to click a verify/login link instead of using your official app.", socialLabel: "Urgency + trust exploitation", pts: 25, type: "Phishing Link" },
    { keys: ["account will be closed", "suspended", "legal action", "within 24 hours", "immediately", "final notice", "act now"], finding: "Uses urgency / threat language to rush you.", socialLabel: "Urgency + fear", pts: 15, type: "Social Engineering" },
    { keys: ["hr department", "payroll update", "direct deposit"], finding: "Possible HR / payroll impersonation.", socialLabel: "Authority (HR)", pts: 20, type: "HR Impersonation" },
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
} {
  const items: { url: string; https: boolean; findings: string[] }[] = [];
  const scamTypes: string[] = [];
  let worst = 0;

  for (const url of urls.slice(0, 10)) {
    const findings: string[] = [];
    let local = 0;
    const https = url.startsWith("https://");
    const host = hostOf(url);

    if (!https) {
      local += 20;
      findings.push("Link is not HTTPS — easier to intercept.");
    }
    for (const tld of SUSPICIOUS_TLDS) {
      if (host.endsWith(tld)) {
        local += 35;
        findings.push(`Suspicious TLD (${tld}) — often used in phishing kits.`);
        scamTypes.push("Suspicious Link");
        break;
      }
    }
    for (const s of SHORTENERS) {
      if (host === s || host.endsWith(`.${s}`)) {
        local += 25;
        findings.push("Shortened URL hides the real destination.");
        scamTypes.push("Hidden Link");
        break;
      }
    }
    for (const brand of BRANDS) {
      if (
        host.includes(brand) &&
        !host.endsWith(`${brand}.com`) &&
        !host.endsWith(`${brand}.in`) &&
        !FREE_MAIL.has(host)
      ) {
        local += 40;
        findings.push(`Brand name in a non-official domain (${host}) — likely fake login.`);
        scamTypes.push("Typosquatting URL");
        break;
      }
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      local += 40;
      findings.push("Link uses a raw IP address instead of a normal website name.");
    }
    if (DANGER_EXT.test(url) || url.toLowerCase().includes(".apk")) {
      local += 45;
      findings.push("URL points at a downloadable program/APK — high malware risk.");
      scamTypes.push("Malware Delivery");
    }

    if (findings.length === 0) {
      findings.push("No strong URL red flags from static rules alone.");
    }

    items.push({ url, https, findings });
    worst = Math.max(worst, local);
  }

  if (urls.length === 0) {
    return { items: [], score: 0, scamTypes };
  }

  return { items, score: clamp(worst), scamTypes: [...new Set(scamTypes)] };
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
      local += 70;
      findings.push("Dangerous file type that can run code on your device.");
      intents.push("malware_open");
      scamTypes.push("Malware Attachment");
    }
    if (DOUBLE_EXT.test(lower)) {
      local += 75;
      findings.push("Double extension (e.g. invoice.pdf.exe) — classic malware trick.");
      intents.push("malware_open");
      scamTypes.push("Malware Attachment");
    }
    if (/\.(zip|rar|7z)$/i.test(lower)) {
      local += 35;
      findings.push("Archive file — often used to hide malware or password-protected payloads.");
      scamTypes.push("Suspicious Archive");
    }
    if (/\.(docm|xlsm)$/i.test(lower)) {
      local += 55;
      findings.push("Macro-enabled Office file — common malware dropper.");
      intents.push("malware_open");
      scamTypes.push("Macro Malware");
    }
    if (/invoice|payment|receipt|resume/i.test(lower) && local > 0) {
      findings.push("Filename pretends to be a business document while carrying a dangerous type.");
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
    score += 40;
    findings.push(`SPF ${parsed.spf} — server may not be allowed to send as this domain.`);
  } else if (parsed.spf === "PASS") {
    findings.push("SPF PASS — domain authorizes this sending path (not a full guarantee of safety).");
  }

  if (failish(parsed.dkim)) {
    score += 35;
    findings.push(`DKIM ${parsed.dkim} — message signature check did not pass.`);
  } else if (parsed.dkim === "PASS") {
    findings.push("DKIM PASS — content signature looks valid.");
  }

  if (failish(parsed.dmarc)) {
    score += 40;
    findings.push(`DMARC ${parsed.dmarc} — domain policy check failed.`);
  } else if (parsed.dmarc === "PASS") {
    findings.push("DMARC PASS — aligns with domain policy.");
  }

  if (!parsed.spf && !parsed.dkim && !parsed.dmarc) {
    findings.push("Headers present but SPF/DKIM/DMARC results not found in paste.");
    score += 10;
  }

  return { provided: true, findings, score: clamp(score) };
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
    return { verdict: "suspicious", confidence: score >= 55 ? "Medium" : "Low" };
  }
  return { verdict: "safe", confidence: score <= 15 ? "Medium" : "Low" };
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
  actions.add("Do not click links in this email.");
  actions.add("Do not open attachments unless you verified the sender out-of-band.");
  if (intents.includes("otp") || intents.includes("credential_harvest")) {
    actions.add("Never share OTP, passwords, or PINs from an email or chat.");
  }
  if (intents.includes("payment") || intents.includes("wire_ceo")) {
    actions.add("Do not pay or wire money from this message — confirm via a known official channel.");
  }
  if (intents.includes("malware_open")) {
    actions.add("Do not download or run files — delete the email.");
  }
  if (intents.includes("click_verify")) {
    actions.add("Open your bank/app yourself — don’t use the email’s “verify” button.");
  }
  actions.add("If unsure, show this to a trusted person before doing anything.");
  return [...actions];
}

/**
 * Multi-factor email analysis.
 * No single keyword decides the verdict — weighted blend of sender, content, URLs, attachments, headers.
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

  // Renormalize if headers missing
  const wSum =
    weights.sender + weights.content + weights.urls + weights.attachments + weights.headers;
  const riskScore = clamp(
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

  const { verdict, confidence } = verdictFromScore(riskScore, strongEvidence);
  const intents = [...new Set([...content.intents, ...attachments.intents])];
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
    ...urls.items.flatMap((u) => u.findings.filter((f) => !f.includes("No strong URL"))),
    ...attachments.items.flatMap((a) =>
      a.findings.filter((f) => !f.includes("not clearly dangerous")),
    ),
    ...(headers.provided ? headers.findings.filter((f) => /fail|softfail|not/i.test(f)) : []),
  ].slice(0, 8);

  const plainSummary =
    verdict === "phishing"
      ? "This email looks like phishing. Stop — do not click, pay, share OTP, or open files."
      : verdict === "suspicious"
        ? "This email looks suspicious. Don’t act until you verify through an official channel."
        : "No strong multi-factor phishing signals — still stay careful with unexpected links.";

  const summary =
    verdict === "phishing"
      ? `Phishing likely (score ${riskScore}/100). Combined sender, content, links, and/or attachments raise high risk.`
      : verdict === "suspicious"
        ? `Suspicious (score ${riskScore}/100). Some red flags present; evidence not enough to call definite phishing.`
        : `Safe-leaning (score ${riskScore}/100). Low combined risk across factors.`;

  return {
    riskScore,
    verdict,
    confidence,
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
