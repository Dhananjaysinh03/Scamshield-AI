# ROADMAP — ScamShield AI

**Milestone:** Hackathon Demo v1 (4.5h)
**Strategy:** Demo-critical path first. Atomic commits after each verified block.

## Phases

### Phase 1: Scaffold + Scan Core + Exa Console
**Goal:** Deployable Next.js shell with evidence intake, URL scan, and live Exa threat intel console.
**Requirements:** REQ-01, REQ-02, REQ-03, REQ-04
**Success criteria:**
- `npm run build` succeeds
- User can paste text / upload files into session array
- Detected URLs return risk score + Exa snippets in dark console UI
- Mobile viewport usable (basic)
**Canonical refs:** `.planning/SPEC-SCAMSHIELD.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`

### Phase 2: Stitched Multi-Stage Timeline
**Goal:** Premium interactive timeline graph of psychological attack progression across successive drops.
**Requirements:** REQ-05, NICE-02
**Success criteria:**
- Multiple evidence drops appear as ordered stages
- Stages labeled (Urgency Escalation → Authority Impersonation → Financial Extortion, etc.)
- Interactive (hover/select stage details)
**Canonical refs:** `.planning/SPEC-SCAMSHIELD.md` § System B

### Phase 3: Reverse Poisoning Honeypot
**Goal:** Mic-drop dismantle panel with async fake-credential blast + live injection counter.
**Requirements:** REQ-06, REQ-07
**Success criteria:**
- High-risk verified phishing unlocks Dismantle Attack panel
- Server route runs non-blocking async loop synthesizing mock profiles
- UI terminal ticks: `[Honeypot Active]: Injected N fake credentials...`
- Default path is **simulated** blast (no real third-party POSTs)
**Canonical refs:** `.planning/SPEC-SCAMSHIELD.md` § System A

### Phase 4: Mobile Polish + Audio + Render Ship
**Goal:** Win mobile prize aesthetics; optional ElevenLabs readout; Render deploy ready.
**Requirements:** REQ-08, REQ-09, REQ-10
**Success criteria:**
- Flawless mobile layout, focus rings, transitions
- TTS route works with key / stubs without
- `render.yaml` (or documented Render deploy) present
**Canonical refs:** `.planning/SPEC-SCAMSHIELD.md` § Skills `/ui-polish`, `/audio-alert`

## Progress

| Phase | Status |
|-------|--------|
| 1 — Scaffold + Scan + Exa | Context gathering |
| 2 — Timeline | Pending |
| 3 — Honeypot | Pending |
| 4 — Polish + Ship | Pending |
