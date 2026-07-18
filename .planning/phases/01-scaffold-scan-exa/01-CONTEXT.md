# Phase 1: Scaffold + Scan Core + Exa Console - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning
**Mode:** FAFO / `--auto` (all recommended defaults locked)

<domain>
## Phase Boundary

Deliver a deployable Next.js App Router shell with evidence intake (text + files → transient session array), URL extraction + phishing risk scan (heuristics + optional LLM), and a dark-mode Exa threat-intel console that streams live search snippets for detected links. Timeline graph, honeypot dismantle panel, ElevenLabs TTS, and final Render polish are **out of scope** (Phases 2–4).

</domain>

<decisions>
## Implementation Decisions

### Stack & project layout
- **D-01:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS — single app deployable to Render
- **D-02:** API routes under `app/api/*` for scan, exa, (future honeypot/audio) — no separate Express server
- **D-03:** No auth, no DB, no Prisma/Supabase/Clerk — client state (React) + optional in-memory server Map for short-lived jobs
- **D-04:** Package manager: npm; scripts: `dev`, `build`, `start` must work first-pass

### Evidence intake UX
- **D-05:** Primary intake = large paste textarea + multi-file upload (txt/png/jpg/pdf accepted; PDFs/images stored as metadata + text extract best-effort or filename/label if unreadable)
- **D-06:** Evidence stored in client-side session array (`EvidenceItem[]`) with id, type, timestamp, raw text/url refs — survives within tab only
- **D-07:** "Add another drop" flow for successive evidence (feeds Phase 2 timeline later); Phase 1 shows a simple chronological list of drops
- **D-08:** Empty state: single CTA to paste SMS/WhatsApp/email text or upload screenshot — no marketing clutter in first viewport beyond brand + intake

### Scan & risk engine
- **D-09:** On "Scan", call `POST /api/scan` with evidence payload; extract URLs via regex; score with heuristics (suspicious TLDs, IP hosts, urgency keywords, brand impersonation tokens, HTTP vs HTTPS, shorteners)
- **D-10:** If `OPENAI_API_KEY` (or `LLM_API_KEY`) present, enrich classification with short JSON verdict; if absent, heuristics-only (must still demo fully)
- **D-11:** Response shape: `{ riskLevel: 'low'|'medium'|'high'|'critical', score: 0-100, urls: [...], signals: string[], summary: string }`
- **D-12:** High/critical risk surfaces a disabled/locked "Dismantle Attack" teaser button (Phase 3 wires it) — Phase 1 may show "Unlocks after honeypot phase" or simply render the panel shell disabled

### Exa threat intel console
- **D-13:** For each extracted URL, server calls Exa via `POST /api/exa` (keep key server-side only)
- **D-14:** Exa call pattern: `exa.search(targetUrl, { category: "news", contents: { highlights: true }, numResults: 3 })` with forum-style query fallback if news empty — match SPEC
- **D-15:** UI: dark security console component streaming lines like `[Exa Threat Intel]: ...`; graceful fallback when `EXA_API_KEY` missing: synthetic demo intel clearly marked `[DEMO MODE]`
- **D-16:** Show registrar/age style narrative when highlights mention newness/fraud; otherwise show raw highlight snippets (do not invent facts when Exa returns empty — say "No public consensus found")

### Visual / mobile (Phase 1 baseline)
- **D-17:** Dark tech aesthetic (zinc/neutral + single accent, e.g. emerald or cyan — **not** purple-gradient AI cliché); expressive font pair via `next/font` (e.g. Syne/Geist or similar — avoid Inter/Roboto defaults)
- **D-18:** Mobile-first: intake + results stack vertically; console scrollable; touch targets ≥44px
- **D-19:** Brand "ScamShield AI" is hero-level on first viewport with one headline + intake — no stat strips/cards in hero

### Env & secrets
- **D-20:** `.env.example` documents `EXA_API_KEY`, `OPENAI_API_KEY` (optional), `ELEVENLABS_API_KEY` (Phase 4)
- **D-21:** Never commit real keys; missing keys → demo-mode paths, never crash build

### the agent's Discretion
- Exact component file tree under `app/` and `components/`
- Heuristic weight table values
- Whether to use `exa-js` SDK vs raw fetch (prefer official SDK if lightweight)
- Skeleton/loading animation details
- Whether disabled honeypot teaser is visible in Phase 1 UI

</decisions>

<specifics>
## Specific Ideas

- Judges reject basic screenshot-to-LLM — Exa live intel + risk signals must be visible in the first demo minute
- Console copy tone: terse SOC/terminal voice (`[Exa Threat Intel]:`, `[Scan]:`)
- Production PRD mic-drop systems deferred: Timeline = Phase 2, Honeypot = Phase 3, Audio/Render polish = Phase 4
- FAFO user intent: skip interactive questioning; ship with recommended defaults from discuss bootstrap

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & constraints
- `.planning/SPEC-SCAMSHIELD.md` — Systems A/B/C, hard restrictions, skills hooks
- `.planning/PROJECT.md` — Core value, out of scope, key decisions
- `.planning/REQUIREMENTS.md` — REQ-01..REQ-04 for this phase
- `.planning/ROADMAP.md` — Phase 1 success criteria

### External APIs (implement against current docs at plan/research time)
- Exa Search API — `exa.search` with highlights, numResults: 3, news/forum categories
- OpenAI (optional) — short JSON classification only when key present

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield repository

### Established Patterns
- None yet — Phase 1 establishes App Router + API route + Tailwind patterns

### Integration Points
- Future Phase 2 reads same `EvidenceItem[]` session array
- Future Phase 3 consumes `riskLevel` high/critical + extracted form/action URLs
- Future Phase 4 reuses console + dashboard chrome for TTS + mobile polish

</code_context>

<deferred>
## Deferred Ideas

- Multi-stage interactive timeline graph — Phase 2
- Reverse Poisoning real/simulated POST blast + live counter — Phase 3
- ElevenLabs verbal security readouts — Phase 4
- `render.yaml` + production deploy — Phase 4
- Hybrid honeypot to self-hosted mock sink — Phase 3 NICE
- Export timeline JSON — backlog

</deferred>

---

*Phase: 01-scaffold-scan-exa*
*Context gathered: 2026-07-18*
