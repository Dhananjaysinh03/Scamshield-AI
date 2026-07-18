# Phase 1 Research — Scaffold + Scan + Exa

**Date:** 2026-07-18  
**Mode:** FAFO lean research (orchestrator; skip full researcher agent for velocity)

## Stack

| Choice | Decision | Why |
|--------|----------|-----|
| Framework | Next.js 15 App Router + TypeScript | Single Render process (`next start`) |
| Styling | Tailwind CSS v4 or v3 via `create-next-app` | Fast dark UI |
| Exa | `exa-js` latest (^2.16) | Official SDK; keep key server-side |
| LLM | Optional `openai` package only if key used — or raw fetch | Avoid hard dep if unused; prefer conditional dynamic import |

## Exa API (2026)

```ts
import Exa from "exa-js";
const exa = new Exa(process.env.EXA_API_KEY);
const result = await exa.search(`phishing OR scam OR fraud ${hostname}`, {
  type: "auto",
  numResults: 3,
  category: "news",
  contents: { highlights: true, text: { maxCharacters: 500 } },
});
```

- Prefer query enriched with hostname + fraud keywords (bare URL alone is weak).
- If `highlights` throws on older SDK quirks, fall back to `contents: { text: { maxCharacters: 800 } }`.
- Category `"forum"` may not be in current enum — use `news` first; second pass without category if empty.
- Missing `EXA_API_KEY` → return `{ mode: "demo", lines: [...] }` — never 500 the UI.

## Heuristic signals (no ML required)

- URL: IP host, non-HTTPS, punycode/homoglyph, brand tokens in subdomain (`paypal-secure.evil.xyz`), shorteners, suspicious TLD (`.zip`, `.mov`, `.tk`, `.ml`, `.ga`, `.cf`, `.gq`)
- Text: urgency (`immediately`, `suspend`, `within 24 hours`), authority (`RBI`, `Income Tax`, `KYC`), payment (`UPI`, `gift card`, `bitcoin`)
- Score band → `low|medium|high|critical`

## Render

- `output: 'standalone'` in `next.config` for Docker/Render Node
- Start: `npm run build && npm start`
- Env vars in Render dashboard: `EXA_API_KEY`, optional `OPENAI_API_KEY`

## Pitfalls

- Do not call Exa from client components
- Do not block first paint on Exa — scan then parallel exa per URL
- `create-next-app` interactive prompts — use non-interactive flags
