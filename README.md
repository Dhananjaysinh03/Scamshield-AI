# ScamShield AI

**Email phishing prevention for everyday people.**  
Paste or open mail → multi-factor check → **HARD STOP** before OTP, pay, open file, or screen share.

> We don’t prove the From line is real. We stop irreversible actions.

**Team:** Neural Nexus · Cursor Community Hackathon Ahmedabad 2026

---

## Live demo

**https://scamshield-ai-k6i1.onrender.com/**

| Path | What judges see |
|------|-----------------|
| [`/`](https://scamshield-ai-k6i1.onrender.com/) | Pitch landing + one-tap live check |
| [`/inbox`](https://scamshield-ai-k6i1.onrender.com/inbox) | **ScamShield in Mail** (Gmail-like + side panel) |
| [`/check`](https://scamshield-ai-k6i1.onrender.com/check) | Paste checker + evidence + JSON report |

---

## Pitch demo (60–90 seconds)

1. Open the [live site](https://scamshield-ai-k6i1.onrender.com/)
2. Tap **Open In Mail demo** → `/inbox`
3. Open the pulsing **HDFC OTP** mail
4. Show **trust popup** + ScamShield panel (security level · threat checklist · STOP)
5. Optional: click the fake **verify** link → link HARD STOP
6. Optional contrast: open **Priya / Lunch** (genuine)
7. Optional: `/check` for paste + evidence pack

**Line to say:** *“We don’t prove From is real. We stop irreversible actions.”*

Tap **Reset pitch** in the inbox top bar before each rehearsal so the trust popup always shows.

---

## What it scores

| Factor | Weight | Looks for |
|--------|--------|-----------|
| Sender | 25% | Fake banks, temp-mail, Reply-To tricks |
| Content / pressure | 20% | OTP, pay now, urgency, remote access |
| URLs | 20% | Fake login pages & shady domains |
| Attachments | 20% | Dangerous names like `.pdf.exe` |
| Headers | 15% | SPF / DKIM / DMARC **when present** (never invent PASS) |

---

## Core API

```http
POST /api/email-analyze
Content-Type: application/json

{ "raw": "paste full email text here", "officialDomain": "optional" }
```

Returns `verdict` (`safe` | `suspicious` | `phishing`), `riskScore`, `preventionLevel` (`hard_stop` when irreversible ask), reasons, technical findings, and `meta`.

`GET /api/email-analyze` → engine status + demo catalog.

---

## Run locally

```bash
git clone https://github.com/Dhananjaysinh03/Scamshield-AI.git
cd Scamshield-AI
npm install
npm run dev
```

Open http://localhost:3000 → `/inbox`

Optional `.env.local` (see `.env.example`):

| Key | Purpose |
|-----|---------|
| `EXA_API_KEY` | Enrich URL threat intel |
| `OPENAI_API_KEY` | Optional OCR / vision on screenshots |

Works without keys (rule engine + demos).

---

## Stack

- Next.js App Router · React · TypeScript · Tailwind
- No auth · no database (hackathon MVP)
- Deploy: [Render](https://render.com) (`render.yaml`)

---

## Out of scope (do not pitch)

SMS / WhatsApp · “detect all scams” · Proofpoint clone · claiming 100% certainty on From identity

---

## License

Hackathon project · Neural Nexus · 2026
