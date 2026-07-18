# MVP — SHIPPED (30-min demo)

## Live
https://scamshield-ai-k6i1.onrender.com/

## What the product is
**ScamShield** = paste a weird email → plain STOP before OTP / pay / open file / screen share.

## Demo script (90 seconds)
1. Open live site  
2. Tap **Try the demo** (fake bank OTP) → show **Stop first**  
3. Open **How it works** tab → 4 steps  
4. Optional: More examples → Normal email (contrast)  
5. Say: “We don’t prove From is real. We stop irreversible actions.”

## Do NOT demo
SMS, WhatsApp, honeypot vault, “100% virus”, Proofpoint clone.

## Local backup
```bash
git pull
npm run dev
```
Open http://localhost:3000

## Pass checks (already verified)
| Demo | Result |
|------|--------|
| Fake bank OTP | phishing · hard_stop |
| Prize file | phishing · hard_stop |
| Temp-mail | phishing · hard_stop |
| Fake support | phishing · hard_stop |
| Normal email | safe |

**MVP is ready. Go pitch.**
