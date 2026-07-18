# ONE DOMAIN (LOCKED) — Hackathon win frame

## One problem · One solution · One product
| | |
|--|--|
| **Problem** | Email phishing & BEC (OTP, wire, gift/malware, fake support) |
| **Solution** | Paste email → multi-factor check → **HARD STOP** before irreversible action |
| **Product** | **ScamShield** — email phishing prevention for non-tech users |

Not: SMS/WhatsApp · “detect all scams” · Proofpoint clone · trust-oracle for From addresses.

## Proofpoint validates the problem (we don’t copy the product)
Enterprise Proofpoint Email Protection exists because **email is #1 threat vector** — phishing, malware, and **malware-less BEC** (CEO gift / wire / invoice).

| Enterprise (Proofpoint-class) | ScamShield (our wedge) |
|--|--|
| Block at gateway | User pastes **before they act** |
| ML + IP rep + quarantine | Multi-factor rules + irreversible-action brake |
| Outlook warning tags | Plain **HARD STOP** card + reasons |
| Fortune / SLA / DLP | Hackathon: no auth, no DB, mobile-first |

**Pitch:** Same threat enterprises buy Proofpoint for — we ship the **consumer HARD STOP** when someone is about to OTP, pay, open a file, or share screen.

## Product sentence
ScamShield scores a pasted email across **sender · pressure · links · attachments · headers (if present)** and blocks the irreversible next step.

## Mentor attacks (locked answers)
| Attack | Answer |
|--|--|
| Temp mail / VPN | Identity is cheap — we don’t trust From; we STOP the action |
| Gmail alone | Not scam by itself; CEO/bank-on-Gmail + gift/wire/OTP is |
| “Do you know it’s a scam?” | We don’t claim certainty — enough factors → treat as phishing + HARD STOP |
| WhatsApp? | Out of scope. We own email phishing end-to-end |

## Demo order (2 min)
1. Bank OTP → HARD STOP  
2. CEO gift / fake invoice malware → don’t open file  
3. Temp-mail From → identity cheap, still STOP  
4. Vault optional 10s (not the claim)

## FE / BE rule
Consumer = `POST /api/email-analyze` only. Vault collapsed. Copy never widens past email phishing.
