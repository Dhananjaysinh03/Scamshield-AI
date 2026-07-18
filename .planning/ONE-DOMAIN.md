# ONE DOMAIN (LOCKED)

## Domain
**Email phishing defense for non-tech users.**

Not: generic scam detection · SMS/WhatsApp oracle · “AI that catches everything” · temp-mail policing.

## Product sentence
ScamShield scores a pasted email across **sender · pressure · links · attachments · headers (if present)** and blocks the irreversible next step (OTP / pay / open file / remote access).

## Why this wins mentors
- Concrete surface (email), not “all scams forever”
- Multi-factor → bypass one signal and others still fire
- Honest when headers/intel missing
- Honeypot / Exa / SOC vault = optional judge depth, not the consumer claim

## Out of scope for pitch
- Claiming SMS/WhatsApp as core
- VirusTotal / WHOIS / trained ML unless wired
- Inventing SPF/DKIM/DMARC PASS

## FE / BE rule
Consumer path = `POST /api/email-analyze` only. Vault stays behind “technical details.”
