/**
 * In-memory sender reputation for MVP (no DB).
 * Counts how often a From address / domain was flagged as phishing in this server process.
 * Seeded with known demo scam identities so the pitch shows “often used for scams”.
 */

export type SenderReputation = {
  email: string | null;
  domain: string | null;
  timesFlagged: number;
  level: "none" | "seen" | "frequent" | "known_bad";
  plainMessage: string | null;
};

type Entry = { count: number; lastAt: number };

const byEmail = new Map<string, Entry>();
const byDomain = new Map<string, Entry>();

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

seedKnownBadSenders();

export function recordPhishingSender(email: string | null, domain: string | null) {
  if (email) bump(byEmail, email);
  if (domain) bump(byDomain, domain);
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
