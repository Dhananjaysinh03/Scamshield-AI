# ScamShield

**MVP:** Check if an email is trying to trick you.

Paste → multi-factor check → **STOP** before OTP / pay / open file / screen share.

## Demo (90s)
1. Open the site → **Try the demo**  
2. Show STOP card  
3. Tab **How it works**  
4. Optional: Normal email (looks okay)

Live: https://scamshield-ai-k6i1.onrender.com/

## Run locally
```bash
npm install
npm run dev
```

## Core API
`POST /api/email-analyze` `{ "raw": "paste email text" }`

Hackathon · Neural Nexus · email phishing only.
