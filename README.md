# ScamShield AI

Offensive phishing defense for Cursor Community Hackathon Ahmedabad 2026 (Neural Nexus).

## Run

```bash
npm install
cp .env.example .env.local   # add EXA_API_KEY when available
npm run dev
```

Build: `npm run build` then `npm start`.

## Env

| Key | Required | Purpose |
|-----|----------|---------|
| `EXA_API_KEY` | No (demo fallback) | Live threat intel |
| `OPENAI_API_KEY` | No | Optional scan summary enrich |
| `ELEVENLABS_API_KEY` | No | Phase 4 TTS |

## Deploy (Render)

Node web service, build `npm run build`, start `npm start`. Set env vars in dashboard. `output: 'standalone'` enabled in `next.config.ts`.

## Constraints

No auth. No persistent DB. In-memory / browser session only.
