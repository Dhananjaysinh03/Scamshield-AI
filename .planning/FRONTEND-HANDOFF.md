# ScamShield AI — Frontend Handoff Plan

**For:** Frontend teammate  
**Backend owner:** handles all `app/api/**` and `lib/` engines  
**Stack:** Next.js App Router + React + Tailwind (already scaffolded)  
**Repo:** `d:\CHSC`  
**Run:** `npm install` → `npm run dev` → http://localhost:3000

---

## Your mission

Make judges lean forward with:
1. **Attack timeline** (psychological stages across evidence drops)
2. **Dismantle Attack panel** (live honeypot injection counter)
3. **Mobile polish** (Special Mobile AI prize)

You can ship and demo **with mocks** before backend APIs are ready.

---

## Rules (do not break)

| Do | Don't |
|----|--------|
| Own `components/**`, `app/page.tsx`, `app/globals.css` | Edit `app/api/**` or `lib/heuristics.ts` |
| Commit as `feat(fe): …` after each task | Re-scaffold Next.js / change package manager |
| Use mocks in `lib/mocks/` until APIs return 200 | Call Exa/OpenAI/ElevenLabs from the browser |
| Keep dark zinc + emerald aesthetic | Purple gradients, Inter/Roboto, card-heavy hero |
| Touch targets ≥ 44px; test at 375px width | Break existing intake → scan → console flow |

**Shared file:** `lib/types.ts` — only *add* types (copy from contracts below). If backend renames a field, sync with them first.

---

## What already works (Phase 1 — leave intact)

| Piece | Path |
|-------|------|
| Intake (paste + files) | `components/IntakePanel.tsx` |
| Evidence list | `components/EvidenceList.tsx` |
| Scan results | `components/ScanResults.tsx` |
| Threat console | `components/ThreatConsole.tsx` |
| Disabled honeypot teaser | `components/DismantleTeaser.tsx` → **you replace this** |
| Dashboard wiring | `components/Dashboard.tsx` → **you extend this** |
| Types | `lib/types.ts` — `EvidenceItem`, `ScanResult`, etc. |

Flow today: add drops → **Scan now** → `/api/scan` + `/api/exa` → console lines.

---

## API contracts (backend will provide)

Use these exact shapes. Until endpoints exist, return the same shapes from mocks.

### Timeline — `POST /api/timeline`
```ts
// Request
{ evidence: EvidenceItem[] }

// Response
type AttackStage =
  | "urgency_escalation"
  | "authority_impersonation"
  | "credential_harvest"
  | "financial_extortion"
  | "unknown";

type TimelineStage = {
  id: string;
  order: number;
  stage: AttackStage;
  label: string;       // e.g. "Urgency Escalation"
  evidenceIds: string[];
  confidence: number;  // 0–1
  rationale: string;
  timestamp: string;
};

type TimelineResult = {
  stages: TimelineStage[];
  narrative: string;
};
```

### Honeypot — start + poll
```ts
// POST /api/honeypot/start
// Request
{ targetUrl: string; riskLevel: RiskLevel; intensity?: "demo" | "burst" }
// Response
{ jobId: string; mode: "simulated" | "live_sink"; status: "running" | "done" | "error" }

// GET /api/honeypot/[jobId]  — poll every 400ms
{
  jobId: string;
  injected: number;
  status: "running" | "done" | "error";
  lastProfilePreview?: string;
  lines: string[];  // append these to your terminal UI
}
```

### Audio — `POST /api/audio` (Phase 4)
```ts
// Request
{ text: string }
// Response
| { mode: "live"; audioBase64: string; mime: string }
| { mode: "stub"; message: string }
```

**Flag to switch mocks → real:** e.g. `const USE_MOCKS = false` in one place when backend says “timeline/honeypot live”.

---

## Files you create / own

```
components/AttackTimeline.tsx       ← NEW
components/StageDetail.tsx          ← NEW
components/DismantlePanel.tsx       ← NEW (replaces DismantleTeaser)
components/HoneypotTerminal.tsx     ← NEW (or extend ThreatConsole)
components/AudioAlertButton.tsx     ← NEW
components/Dashboard.tsx            ← WIRE only
app/page.tsx                        ← light polish only
app/globals.css                     ← motion / polish tokens
lib/mocks/timeline.ts               ← TEMP
lib/mocks/honeypot.ts               ← TEMP
lib/mocks/demoFunnel.ts             ← TEMP (seed pitches)
```

---

## Task board (do in order)

### FE-T1 — Timeline UI with mocks (~45–60 min)

**Build**
1. `lib/mocks/timeline.ts` — return 3 stages:
   - Urgency Escalation  
   - Authority Impersonation  
   - Financial Extortion  
2. `AttackTimeline.tsx` — vertical timeline (mobile: stacked or horizontal scroll).
3. Click/hover stage → `StageDetail` shows `rationale` + linked evidence text.
4. Light motion: stagger fade-in + active stage glow (2–3 animations max).
5. Wire into `Dashboard` **below** `EvidenceList`.

**Done when**
- [ ] 3 mock stages render
- [ ] Selecting a stage updates detail panel
- [ ] Works on 375px width
- [ ] `npm run build` passes

**Commit:** `feat(fe): attack timeline UI with mock stages`

---

### FE-T2 — Wire real timeline API (~20 min)

**Build**
1. Add **“Build timeline”** button (or auto-run after successful scan).
2. `POST /api/timeline` with current `evidence` array.
3. States: loading / empty / error (SOC tone in console, e.g. `[Timeline]: …`).
4. When backend is ready, set `USE_MOCKS = false` and delete mock import.

**Done when**
- [ ] Real drops produce stages from API (or mock still if BE pending)
- [ ] Error doesn’t crash the page

**Commit:** `feat(fe): connect timeline to /api/timeline`

---

### FE-T3 — Dismantle Attack panel (~45 min)

**Build**
1. Replace `DismantleTeaser` with `DismantlePanel`.
2. **Enable** only when `scan.riskLevel` is `high` or `critical` **and** `scan.urls.length >= 1`.
3. UI: pick target URL, Start / Stop, big **Injected N** counter.
4. On Start: `POST /api/honeypot/start` (or mock that ticks `injected` every 400ms).
5. Poll `GET /api/honeypot/[jobId]` every 400ms; append `lines` to terminal.
6. Hero line when done/high count:  
   `[Honeypot Active]: Injected N fake credentials. Scammer database corrupted successfully.`

**Mock behavior (until BE ready)**
- Fake `jobId`, increment `injected` by 7–23 each poll, stop at ~1420.

**Done when**
- [ ] Mic-drop counter visibly races up
- [ ] Disabled state still clear for low/medium risk
- [ ] `npm run build` passes

**Commit:** `feat(fe): dismantle attack panel with live counter`

---

### FE-T4 — Mobile polish + audio button (~40 min)

**Build**
1. Audit at **375px**: no horizontal scroll, brand still hero-level.
2. Focus rings + press states on all buttons/inputs.
3. `AudioAlertButton`: sends last `scan.summary` to `POST /api/audio`.
   - `live` → play audio from base64  
   - `stub` → toast/console message (OK for demo)
4. Optional: subtle page transitions only if cheap.

**Done when**
- [ ] Phone layout feels intentional (prize-ready)
- [ ] Audio button never hard-crashes without backend

**Commit:** `feat(fe): mobile polish and audio alert button`

---

### FE-T5 — Demo funnel button (~15 min)

**Build**
1. `lib/mocks/demoFunnel.ts` — 3 sequential phishing texts (SMS → WhatsApp threat → fake payment link).
2. Button **“Load demo funnel”** on Dashboard pre-fills `evidence`.
3. One-click path for pitch: Load → Scan → Timeline → Dismantle.

**Done when**
- [ ] Pitch person can demo without typing

**Commit:** `feat(fe): demo funnel seed for pitch`

---

## Design constraints (hackathon UI rules)

- **Brand first:** “ScamShield AI” stays the hero signal — don’t bury it.
- **Dark tech:** zinc background, emerald accent (`--accent` already in `globals.css`).
- **No cards in hero;** cards only if needed for interaction.
- **Console tone:** `[Scan]:`, `[Exa Threat Intel]:`, `[Timeline]:`, `[Honeypot Active]:`
- Fonts already set: Syne / DM Sans / JetBrains Mono — keep them.

---

## How to work with backend

1. Start on **FE-T1 mocks immediately** — don’t wait.
2. When they say “timeline live” → FE-T2.  
3. When they say “honeypot live” → flip mocks in FE-T3.  
4. Ping them only if: response shape differs from this doc, or CORS/404 on expected routes.
5. **Do not** put `EXA_API_KEY` / other secrets in client code.

---

## Quick verify checklist (before you say “done”)

```bash
npm run build
npm run dev
```

Manual:
1. Load demo funnel → Scan → see console + risk  
2. Build timeline → 3 stages, click detail  
3. If high risk → Dismantle → counter climbs  
4. Resize to 375px → nothing broken  
5. Audio button → stub or playback  

---

## 60-second pitch click path (for Product)

1. **Load demo funnel**  
2. **Scan now** → point at Exa/console  
3. **Build timeline** → tell the story (urgency → authority → money)  
4. **Dismantle Attack** → watch counter → “database corrupted”  
5. Flip phone → “works on mobile”

---

## Questions? Ask backend owner about

- Exact path: `/api/honeypot/start` vs `/api/honeypot`  
- Whether timeline auto-runs after scan  
- When `USE_MOCKS` can go `false`

**You own the look. They own the engines. Ship FE-T1 first.**
