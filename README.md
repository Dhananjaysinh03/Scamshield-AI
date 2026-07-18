# ScamShield AI

Offensive phishing defense for Cursor Community Hackathon Ahmedabad 2026 (Neural Nexus).

## Run

```bash
npm install
cp .env.example .env.local   # add keys when available
npm run dev
```

Build: `npm run build` then `npm start`.

## Env

| Key | Required | Purpose |
|-----|----------|---------|
| `EXA_API_KEY` | No (demo fallback) | Live threat intel |
| `OPENAI_API_KEY` | No | Optional scan summary enrich |
| `ELEVENLABS_API_KEY` | No | TTS readout (stub without) |
| `ELEVENLABS_VOICE_ID` | No | Override default ElevenLabs voice |

## Backend APIs (for frontend)

| Method | Path | Body → notes |
|--------|------|----------------|
| POST | `/api/analyze` | `{ evidence }` → scan + timeline + parallel Exa (pitch-fast) |
| POST | `/api/scan` | `{ evidence }` → risk score |
| POST | `/api/exa` | `{ url }` → threat lines (demo if no key) |
| POST | `/api/timeline` | `{ evidence }` → staged attack timeline |
| GET | `/api/health` | uptime / key presence |
| POST | `/api/honeypot/start` | `{ targetUrl, riskLevel, intensity? }` → `{ jobId }` (high/critical only; **simulated**) |
| GET | `/api/honeypot/[jobId]` | poll every ~400ms → `{ injected, status, lines }` |
| DELETE | `/api/honeypot/[jobId]` | stop job early |
| POST | `/api/audio` | `{ text }` → live audio or stub |

## Deploy (Render)

1. Connect [Scamshield-AI](https://github.com/Dhananjaysinh03/Scamshield-AI) on Render
2. Blueprint uses `render.yaml` — or Web Service:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Health: `/api/health`
3. Set `EXA_API_KEY` (required for live intel)
4. Optional: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`

## Team handoffs

- FE prompt: `.planning/FE-HANDOVER-PROMPT.md`
- Full FE plan: `.planning/FRONTEND-HANDOFF.md`

## Constraints

No auth. No persistent DB. In-memory / browser session only. Honeypot default = **simulated** (no real phishing POSTs).

## Team

- Frontend handoff: `.planning/FRONTEND-HANDOFF.md`
- Backend lane: this README + `lib/timeline.ts`, `lib/honeypot.ts`, `lib/audio.ts`
