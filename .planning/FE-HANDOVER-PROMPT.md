# FE HANDOVER — ONE PRODUCT ONLY

## Pull
```bash
git pull
npm run dev
```
Live: https://scamshield-ai-k6i1.onrender.com/

## Lock (read twice)
**ScamShield = email phishing prevention. Nothing else.**

One problem · one solution · one product.  
Not SMS. Not WhatsApp. Not “AI scam detector.” Not enterprise Proofpoint.

**Pitch:**  
> Email is #1 phishing vector. Paste the email. Multi-factor check. HARD STOP before OTP / pay / open file / remote access.

## API (don’t rewrite scoring)
`POST /api/email-analyze` — `{ raw, officialDomain? }`  
Engine: `lib/email/**` — **do not touch**

## UI focus
`components/SimpleCheck.tsx` only for consumer story.

**Must be loud:** HARD STOP card after verdict.  
**Must be quiet:** offensive vault (collapsed).  
**Must say:** Treat as phishing / HARD STOP — never “we prove it’s a scam.”

## FE polish priority
1. Mobile 375px — no overflow  
2. HARD STOP hierarchy  
3. Demo rail (email attacks only)  
4. Honest email-only copy in hero  
5. Commit `feat(fe): …`

## Demo script with judges
1. Bank OTP  
2. Fake invoice / CEO gift malware  
3. Temp-mail  
4. Optional vault 10s
