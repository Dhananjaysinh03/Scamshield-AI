# FE HANDOVER — Email phishing guard (CURRENT)

## Pull
```bash
git pull
npm run dev
```
Live: https://scamshield-ai-k6i1.onrender.com/

## Domain (LOCKED — do not widen)
**Email phishing only.** Not SMS / WhatsApp / “detect all scams.”

**Pitch line:**  
> Bypass one keyword and you still fail sender + link + attachment + intent. We don’t prove the From is real (temp mail/VPN are cheap). We HARD STOP OTP / pay / malware / remote access.

## What BE already shipped (don’t rewrite)
| Piece | Path |
|--------|------|
| Core API | `POST /api/email-analyze` `{ raw, officialDomain? }` |
| Engine | `lib/email/**` — **do not change scoring** |
| Consumer UI shell | `components/SimpleCheck.tsx` |
| Demos (5) | CEO · Fake invoice · Bank OTP · Fake support · **Temp-mail** |
| Result fields | `verdict`, `riskScore`, `preventionLevel`, `hardStops[]`, `reasons`, `dangerousIntents`, `technicalFindings`, factor `weights` |

## UI already there
- Paste email / `.eml` / screenshot OCR
- Optional official domain (`acme.com`)
- Factor score bars
- **HARD STOP** card (`hardStops`)
- Intent chips + scam-type chips
- Technical JSON + optional Exa/timeline/honeypot vault

## Your FE modifications (priority order)
1. **Mobile 375px** — demos chip-rail, Stop card, verdict, no horizontal overflow
2. **HARD STOP card** — biggest visual after verdict (red/danger tokens). Victim must see “DO NOT …” first
3. **Demo cards** — 5 demos readable on mobile (scroll rail OK); labels stay email-attack names
4. **Copy stays honest** — never “we know this is a scam.” Prefer “Treat as phishing” / “HARD STOP” / “verify out-of-band”
5. **Light consumer theme** — match mock; vault stays collapsed behind “offensive toolkit”
6. **Empty / loading / error** — clear states for Check email

## Do NOT
- Call Exa / honeypot from the browser
- Widen product to SMS/WhatsApp in hero
- Edit `lib/email/analyzeEmail.ts` or scoring weights
- Invent SPF/DKIM results in UI when `headers.provided === false`

## Commit style
```text
feat(fe): <what you polished>
```
Examples: `feat(fe): harden HARD STOP card on mobile` · `feat(fe): demo rail + verdict hierarchy`

## Mentor demo script (for you + BE)
1. Bank OTP → PHISHING · HARD STOP  
2. Fake invoice → malware Stop  
3. Temp-mail → “identity is cheap; we still STOP”  
4. Optional vault 10s
