# MVP — SHIPPED (pitch demo)

## Live
https://scamshield-ai-k6i1.onrender.com/

## What the product is
**ScamShield** = email phishing prevention for everyday people.  
Multi-factor check → **HARD STOP** before OTP / pay / open file / screen share.  
Also ships as **ScamShield in Mail** (Gmail-like inbox + side panel).

## Demo script (60–90 seconds)
1. Open live site `/`  
2. Tap **Open In Mail demo** → `/inbox`  
3. (If rehearsed already) tap **Reset pitch** in the top bar  
4. Open pulsing **HDFC OTP** mail  
5. Show **trust popup** + **ScamShield** panel (security level + threat checklist + STOP)  
6. Optional: click fake verify link → link HARD STOP  
7. Optional contrast: open **Priya / Lunch** (genuine)  
8. Optional: `/check` for paste + evidence + JSON  
9. Say: **“We don’t prove From is real. We stop irreversible actions.”**

### Inbox interactions (if asked)
- Select / archive / spam / delete / star / snooze  
- Reply & Forward compose (demo send + toast)  
- Shortcuts: `j`/`k` next mail · `e` archive · `c` compose · `u` unread · `Esc` back  

## Do NOT demo
SMS, WhatsApp, honeypot vault, “100% virus”, Proofpoint clone.

## Local backup
```bash
git pull
npm run dev
```
Open http://localhost:3000 → `/inbox`

## Pass checks
| Demo | Result |
|------|--------|
| Fake bank OTP | phishing · hard_stop |
| Prize file | phishing · hard_stop |
| Temp-mail | phishing · hard_stop |
| Fake support | phishing · hard_stop |
| Normal email | safe |

**MVP is ready. Go pitch.**
