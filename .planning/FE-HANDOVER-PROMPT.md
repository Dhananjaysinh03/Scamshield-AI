# FE HANDOVER — Email multi-factor guard (CURRENT)

## Product claim (mentor-proof)
ScamShield is a **multi-factor email analyzer**, not a random scam oracle.
We blend **sender + content + URLs + attachments + headers (if present)** → SAFE / SUSPICIOUS / PHISHING + plain “what not to do.”

## Pull
```bash
git pull
npm run dev
```

## Core API
`POST /api/email-analyze`
```json
{ "raw": "From: ...\\n\\nBody...", "officialDomain": "acme.com" }
```
Returns full JSON: riskScore, verdict, reasons, recommendedActions, technicalFindings, factor weights.

## UI already shipped
`components/SimpleCheck.tsx` — paste email, demos (CEO / invoice malware / bank OTP), factor bars, JSON view, optional offensive vault.

## Your polish
- Tighten light UI to mock
- Mobile 375px
- Don’t change scoring logic in `lib/email/**`
- Commit `feat(fe): polish email guard UX`

## Pitch for mentors
> “Bypass one keyword and you still fail sender identity + link + attachment + intent. We explain every factor. We stop OTP/pay/open-file.”
