# FE HANDOVER — Judge-ready UI (CURRENT)

## Pull
```bash
git pull
npm run dev
```
Live: https://scamshield-ai-k6i1.onrender.com/

## Lock
**Email phishing only.** One problem · one solution · one product.

## What shipped for judges
`SimpleCheck.tsx` result hierarchy:
1. **HARD STOP** (or all-clear for Normal email)
2. Verdict + score + intents
3. Why + factor bars
4. Learn how
5. What to do next

Demos (5): Bank OTP · CEO gift virus · Temp-mail · CEO wire · **Normal email** (contrast)

Pitch hint is on-screen under the hero.

## Your polish (optional)
- Mobile 375px overflow check
- Don’t touch `lib/email/**` scoring
- Commit `feat(fe): …`

## Live demo script
1. Bank OTP → HARD STOP  
2. CEO gift virus → Gift/malware  
3. Temp-mail → identity cheap  
4. Normal email → no hard stop (shows we’re not always red)
