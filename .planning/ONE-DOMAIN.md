# ONE DOMAIN (LOCKED)

## Domain
**Email phishing defense for non-tech users.**

Not: generic scam detection · SMS/WhatsApp oracle · “AI that catches everything” · proving a From address is “real.”

## Product sentence
ScamShield scores a pasted email across **sender · pressure · links · attachments · headers (if present)** and blocks the irreversible next step (OTP / pay / open file / remote access).

## Mentor attack: “Anyone can use Smailpro / temp mail / VPN — you can’t trust any mail”
**True. We don’t try to.**

| Bad claim (we refuse) | Our claim |
|---|---|
| “We know if the sender is real” | “From identity is cheap — temp mail / free mail / VPN prove nothing” |
| “We block all disposable inboxes forever” | “Known disposable From/Reply-To is a **red flag**, not a trust stamp” |
| “Safe verdict means trust this person” | “Safe-leaning = no strong *action* lure yet — still don’t OTP/pay from email” |

**Wedge:** victims lose money when they take an **irreversible action**. We stop that action. Attacker infrastructure (temp mail, VPN) is expected — it makes identity *less* trustworthy, which strengthens our STOP, not weakens it.

## Why this wins mentors
- Concrete surface (email), not “all scams forever”
- Multi-factor → bypass one signal and others still fire
- Honest when headers/intel missing
- Disposable sender list + irreversible-action brake
- Honeypot / Exa vault = optional judge depth

## Out of scope for pitch
- Claiming SMS/WhatsApp as core
- VirusTotal / WHOIS / trained ML unless wired
- Inventing SPF/DKIM/DMARC PASS
- Policing every temp-mail provider that will ever exist

## FE / BE rule
Consumer path = `POST /api/email-analyze` only. Vault stays behind “technical details.”
