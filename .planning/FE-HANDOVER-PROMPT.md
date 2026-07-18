# FE HANDOVER — Email-only (LOCKED DOMAIN)

## Domain (do not widen)
**Email phishing guard.** Not SMS/WhatsApp/generic scam chat.

Pitch: multi-factor email analysis → stop OTP / pay / open malware.

## Pull
```bash
git pull
npm run dev
```

## API
`POST /api/email-analyze` — `{ "raw", "officialDomain?" }`

## UI
`SimpleCheck.tsx` — paste email, 3 email demos, factor bars, JSON, optional vault.

## Your polish
- Light UI + mobile 375px
- Copy stays email-only (no “SMS/WhatsApp” in hero)
- Don’t touch `lib/email/**` scoring
- Commit `feat(fe): polish email phishing guard UX`
