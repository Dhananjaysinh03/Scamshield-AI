/**
 * In-memory + file-backed sender reputation (no DB).
 * Counts how often a From address / domain was flagged as phishing.
 * Seeded with known demo scam identities; persists across warm restarts when /tmp is writable.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export type SenderReputation = {
  email: string | null;
  domain: string | null;
  timesFlagged: number;
  level: "none" | "seen" | "frequent" | "known_bad";
  plainMessage: string | null;
};

type Entry = { count: number; lastAt: number };
type Store = { emails: Record<string, Entry>; domains: Record<string, Entry> };

const byEmail = new Map<string, Entry>();
const byDomain = new Map<string, Entry>();

const STORE_PATH = join(tmpdir(), "scamshield-sender-reputation.json");

/** Domains that repeatedly appear in phishing kits / temp mail (demo + heuristics) */
const KNOWN_BAD_DOMAINS = new Set([
  "hdfc-secure-login.xyz",
  "sbi-secure-login.xyz",
  "amazon-gift-secure.xyz",
  "paypal-secure-pay.xyz",
  "paytm-helpdesk.xyz",
  "gift-claim-secure.xyz",
  "smailpro.com",
  "guerrillamail.com",
  "guerrillamail.org",
  "mailinator.com",
  "tempmail.com",
  "yopmail.com",
]);

function bump(map: Map<string, Entry>, key: string, n = 1) {
  const k = key.toLowerCase().trim();
  if (!k) return;
  const prev = map.get(k);
  map.set(k, {
    count: (prev?.count || 0) + n,
    lastAt: Date.now(),
  });
}

function getCount(map: Map<string, Entry>, key: string | null): number {
  if (!key) return 0;
  return map.get(key.toLowerCase().trim())?.count || 0;
}

function loadStore() {
  try {
    if (!existsSync(STORE_PATH)) return;
    const data = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
    for (const [k, v] of Object.entries(data.emails || {})) byEmail.set(k, v);
    for (const [k, v] of Object.entries(data.domains || {})) byDomain.set(k, v);
  } catch {
    /* first boot */
  }
}

function persistStore() {
  try {
    const data: Store = {
      emails: Object.fromEntries(byEmail),
      domains: Object.fromEntries(byDomain),
    };
    writeFileSync(STORE_PATH, JSON.stringify(data), "utf8");
  } catch {
    /* ephemeral FS may deny writes */
  }
}

/** Seed so first demo already shows reputation for known scam senders */
export function seedKnownBadSenders() {
  for (const d of KNOWN_BAD_DOMAINS) {
    if (!byDomain.has(d)) {
      byDomain.set(d, { count: 12 + (d.length % 7), lastAt: Date.now() });
    }
  }
  const seeds = [
    "alerts@hdfc-secure-login.xyz",
    "sbi-alerts@smailpro.com",
    "claim@amazon-gift-secure.xyz",
    "care@paytm-helpdesk.xyz",
  ];
  for (const e of seeds) {
    if (!byEmail.has(e)) {
      byEmail.set(e, { count: 8 + (e.length % 5), lastAt: Date.now() });
    }
  }
}

loadStore();
seedKnownBadSenders();

export function recordPhishingSender(email: string | null, domain: string | null) {
  if (email) bump(byEmail, email);
  if (domain) bump(byDomain, domain);
  persistStore();
}

export function lookupSenderReputation(
  email: string | null,
  domain: string | null,
): SenderReputation {
  const emailCount = getCount(byEmail, email);
  const domainCount = getCount(byDomain, domain);
  const knownBad = !!(domain && KNOWN_BAD_DOMAINS.has(domain.toLowerCase()));
  const timesFlagged = Math.max(emailCount, domainCount);

  let level: SenderReputation["level"] = "none";
  let plainMessage: string | null = null;

  if (knownBad || timesFlagged >= 5) {
    level = knownBad ? "known_bad" : "frequent";
    plainMessage = email
      ? `This email ID (${email}) shows up often in scam-style messages we check — treat it as untrusted.`
      : domain
        ? `Messages from ${domain} often look like scams in our checks — treat this sender as untrusted.`
        : "This sender pattern is often used in scams.";
  } else if (timesFlagged >= 2) {
    level = "seen";
    plainMessage = email
      ? `We've seen ${email} flagged in scam checks before (${timesFlagged}× on this server).`
      : `We've seen this sender domain flagged before (${timesFlagged}×).`;
  } else if (timesFlagged === 1) {
    level = "seen";
    plainMessage = "This sender was flagged in a previous check on ScamShield.";
  }

  return {
    email,
    domain,
    timesFlagged: knownBad ? Math.max(timesFlagged, 8) : timesFlagged,
    level,
    plainMessage,
  };
}

export function reputationStats() {
  return {
    trackedEmails: byEmail.size,
    trackedDomains: byDomain.size,
    storePath: STORE_PATH,
  };
}
