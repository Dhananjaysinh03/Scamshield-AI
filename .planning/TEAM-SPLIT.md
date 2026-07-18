# Team Split — ScamShield AI (2 people)

**Roles**
| Callsign | Owns | Does NOT touch (unless sync) |
|----------|------|------------------------------|
| **FE** — Frontend / Pitch UI | `components/**`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | `app/api/**`, `lib/heuristics.ts`, server secrets |
| **BE** — Backend / APIs | `app/api/**`, `lib/**` (types + engines), `.env.example`, `render.yaml` | Visual layout / timeline SVG / polish CSS |

**Shared contract file (both edit carefully):** `lib/types.ts`  
→ Agree shapes first; FE mocks if BE lagging; BE never renames fields without a shout.

**Git rule:** Atomic commits on your lane. Prefix: `feat(fe):` / `feat(be):`. Merge often (every task).

**Already done (Phase 1):** both lanes have a working baseline. Do not re-scaffold.

---

## Shared API contracts (lock these first — 10 min sync)

```ts
// lib/types.ts — extend, don't break Phase 1 shapes

// Phase 2
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
  label: string;          // "Urgency Escalation"
  evidenceIds: string[];
  confidence: number;     // 0-1
  rationale: string;
  timestamp: string;
};

type TimelineResult = {
  stages: TimelineStage[];
  narrative: string;
};

// Phase 3
type HoneypotStartRequest = {
  targetUrl: string;
  riskLevel: RiskLevel;
  intensity?: "demo" | "burst"; // default demo = simulated
};

type HoneypotStartResponse = {
  jobId: string;
  mode: "simulated" | "live_sink";
  status: "running" | "done" | "error";
};

type HoneypotStatusResponse = {
  jobId: string;
  injected: number;
  status: "running" | "done" | "error";
  lastProfilePreview?: string;
  lines: string[];        // console lines for FE
};

// Phase 4
type AudioReadoutRequest = { text: string };
type AudioReadoutResponse =
  | { mode: "live"; audioBase64: string; mime: string }
  | { mode: "stub"; message: string };
```

| Endpoint | Owner | Method | Body → Response |
|----------|-------|--------|-----------------|
| `/api/timeline` | BE | POST | `{ evidence: EvidenceItem[] }` → `TimelineResult` |
| `/api/honeypot/start` | BE | POST | `HoneypotStartRequest` → `HoneypotStartResponse` |
| `/api/honeypot/[jobId]` | BE | GET | → `HoneypotStatusResponse` (poll every 400ms) |
| `/api/audio` | BE | POST | `AudioReadoutRequest` → `AudioReadoutResponse` |
| Existing `/api/scan`, `/api/exa` | BE (maintain) | — | Don't break FE |

**Mock rule:** Until BE ships, FE uses `lib/mocks/*.ts` returning the shapes above. Swap to `fetch` when 200s land.

---

# PERSON A — FRONTEND Implementation Plan

## Mission
Make judges lean forward: timeline story, live honeypot counter UI, mobile prize polish. Pitch Manager can demo from FE alone with mocks.

## File ownership
```
components/AttackTimeline.tsx      (new)
components/StageDetail.tsx         (new)
components/DismantlePanel.tsx      (replace DismantleTeaser)
components/HoneypotTerminal.tsx    (new — or extend ThreatConsole)
components/AudioAlertButton.tsx    (new)
components/Dashboard.tsx           (wire only)
app/page.tsx / globals.css         (polish)
lib/mocks/timeline.ts              (temp)
lib/mocks/honeypot.ts              (temp)
```

## Sprint board (order matters)

### FE-T1 — Timeline UI shell (Phase 2) — ~45–60 min
1. Build vertical/interactive timeline from mock `TimelineResult`.
2. Stages: hover + click → detail panel (rationale, linked evidence snippets).
3. Motion: stage reveal stagger + active glow (2–3 intentional animations, not noise).
4. Mobile: horizontal scroll OR stacked steps; touch targets ≥44px.
5. Wire into `Dashboard` below evidence list; still works if scan hasn't run.
**Done when:** 3 mock stages render; select updates detail; `npm run build` green.

### FE-T2 — Connect real `/api/timeline` — ~20 min
1. After scan (or dedicated “Build timeline” button), `POST /api/timeline` with `evidence`.
2. Loading + empty + error states in console tone.
3. Delete mocks when BE-T1 is merged.
**Done when:** successive real drops produce labeled stages.

### FE-T3 — Dismantle Attack panel UI (Phase 3) — ~45 min
1. Replace disabled teaser: enable when `riskLevel` is `high|critical` **and** ≥1 URL.
2. Panel: target URL select, intensity toggle (demo), Start / Stop.
3. Poll `GET /api/honeypot/[jobId]` every 400ms; append `lines` to terminal; big counter `Injected N`.
4. Copy: `[Honeypot Active]: Injected 1,420 fake credentials. Scammer database corrupted successfully.`
5. Mock job that increments N if BE not ready.
**Done when:** mic-drop demo works visually with mock or real API.

### FE-T4 — Mobile AI prize polish (Phase 4) — ~40 min
1. Audit 375px / 390px: no horizontal overflow, hero brand intact.
2. Focus rings, button press states, console scroll smoothness.
3. Audio button: calls `/api/audio` with last scan summary; plays blob or shows stub toast.
**Done when:** phone demo looks intentional; no broken layout.

### FE-T5 — Pitch assist (parallel anytime)
1. Seed 3 demo evidence strings in UI (“Load demo funnel” button).
2. 60-second click path script for Product Manager.

## FE verification checklist
- [ ] Timeline interactive on mobile
- [ ] Honeypot counter ticks live
- [ ] No purple-gradient / Inter defaults
- [ ] `npm run build`

---

# PERSON B — BACKEND Implementation Plan

## Mission
Harden engines judges can trust: stage classification, honeypot job runner, TTS stub, Render deploy. FE can mock; you ship truth.

## File ownership
```
lib/types.ts                       (extend — sync with FE)
lib/timeline.ts                    (new — stage classifier)
lib/honeypot.ts                    (new — fake profiles + job store)
lib/audio.ts                       (new — ElevenLabs or stub)
app/api/timeline/route.ts
app/api/honeypot/start/route.ts
app/api/honeypot/[jobId]/route.ts
app/api/audio/route.ts
render.yaml                        (Phase 4)
.env.example                       (update keys)
```

## Sprint board (order matters)

### BE-T1 — Timeline classifier API (Phase 2) — ~45–60 min
1. Extend `lib/types.ts` with timeline types (match contract above).
2. `lib/timeline.ts`: map each evidence drop → `AttackStage` via keyword/heuristic rules (urgency / authority / harvest / extortion). Merge consecutive same-stage drops.
3. `POST /api/timeline` → `TimelineResult` with labels + rationale + confidence.
4. Optional: if `OPENAI_API_KEY`, refine labels; heuristics must work alone.
5. Unit-smoke: node script or curl with 3 sample drops.
**Done when:** curl returns ordered stages; build green.

### BE-T2 — Honeypot job engine (Phase 3) — ~60–75 min
1. In-memory `Map<jobId, Job>` (no DB).
2. `synthesizeProfile()`: regional Indian/US names, alphanumeric passwords, fake routing, spoofed UA headers.
3. `POST /api/honeypot/start`: validate high/critical + url; start async loop; **default `mode: simulated`** (increment counter + generate profiles; do NOT POST to real phishing sites).
4. Loop: every ~50–100ms inject++ until cap (e.g. 500–2000) or stop; push console lines.
5. `GET /api/honeypot/[jobId]`: return `{ injected, status, lines, lastProfilePreview }`.
6. Auto-expire jobs after 2–5 min.
**Done when:** start → poll shows rising `injected`; never crashes without keys.

### BE-T3 — Audio readout (Phase 4) — ~30 min
1. `POST /api/audio`: if no `ELEVENLABS_API_KEY` → `{ mode: "stub", message }`.
2. With key: call ElevenLabs TTS, return base64 audio (or stream if easy).
3. Never throw 500 on missing key.
**Done when:** stub path always works.

### BE-T4 — Render ship (Phase 4) — ~20 min
1. `render.yaml` (web service, `npm run build`, `npm start`, Node 20).
2. Document env vars in README / `.env.example`.
3. Confirm `output: 'standalone'` still set.
**Done when:** teammate can deploy from README alone.

### BE-T5 — Keep Phase 1 APIs healthy (ongoing)
- Don't break `/api/scan` or `/api/exa` response shapes.
- Improve heuristics only if FE asks (brand impersonation, etc.).

## BE verification checklist
- [ ] `curl` timeline with 3 drops → ≥2 stages
- [ ] honeypot poll `injected` increases
- [ ] audio stub without key
- [ ] `npm run build`
- [ ] DEMO MODE still works without Exa key

---

## Parallel calendar (suggested)

| Block | FE | BE | Sync |
|-------|----|----|------|
| 0 (10m) | Read contracts | Lock `lib/types.ts` | Agree field names |
| 1 | FE-T1 mock timeline | BE-T1 timeline API | Merge types |
| 2 | FE-T2 wire timeline | BE-T2 honeypot engine | Contract review |
| 3 | FE-T3 honeypot UI | BE-T2 finish + poll | Integration test |
| 4 | FE-T4 mobile + audio btn | BE-T3 audio + BE-T4 Render | Full demo rehearsal |

## Conflict zones (avoid)
| Hot file | Rule |
|----------|------|
| `lib/types.ts` | BE proposes; FE reviews; one PR at a time |
| `components/Dashboard.tsx` | FE owns; BE only documents required props/API calls |
| `components/ThreatConsole.tsx` | FE owns; BE only returns `lines[]` |
| `app/api/scan` | BE only |

## Demo script (both)
1. Load demo funnel (3 drops) → Scan → Exa console  
2. Timeline builds stages  
3. Dismantle Attack → counter races up  
4. (Optional) Speak readout → show mobile layout to judges  

---

## Who does what if Product/Pitch is person 2?

If the pair is **Elite Dev + Pitch Manager** (not FE/BE both coding):

| Elite Dev | Pitch Manager |
|-----------|---------------|
| All BE + FE coding above | Demo script, seed scenarios, slides, judge Q&A |
| Ship Phases 2–4 | Test on phone; file UI bugs; secure API keys |
| Cursor agent execution | Timebox watchdog; Render account / deploy click |

In that case: **ignore FE/BE split for humans** — use it as Cursor workstreams (`feat(fe)` / `feat(be)` commits) while one driver codes.
