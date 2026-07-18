# Phase 1: Scaffold + Scan Core + Exa Console - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 01-scaffold-scan-exa
**Mode:** FAFO → treated as `--auto`
**Areas discussed:** Stack & layout, Evidence intake, Scan engine, Exa console, Visual/mobile baseline, Env handling

---

## Bootstrap note

Repo had no `.planning` / roadmap. FAFO discuss-phase required bootstrap from `.planning/SPEC-SCAMSHIELD.md` (user PRD) before Phase 1 discuss could run. `[auto] Selected all gray areas.`

---

## Stack & project layout

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js App Router + API routes → Render | Single deployable, zero-config target | ✓ |
| Vite + Express split | More moving parts for Render | |
| Next.js Edge-only | Limits Node SDK usage for Exa | |

**User's choice:** `[auto]` Next.js App Router + API routes → Render (recommended default)
**Notes:** Matches hackathon deploy velocity constraint

---

## Evidence intake

| Option | Description | Selected |
|--------|-------------|----------|
| Text paste + multi-file upload → session array | Full System B feed for later timeline | ✓ |
| Text-only drops | Faster but weaker demo | |
| Screenshots-only vision pipeline | Higher complexity / LLM-wrapper risk | |

**User's choice:** `[auto]` Text paste + multi-file upload into in-memory session array
**Notes:** PDFs/images best-effort; no persistent storage

---

## Scan & risk engine

| Option | Description | Selected |
|--------|-------------|----------|
| Heuristics + Exa + optional LLM | Zero-day signal, works without LLM key | ✓ |
| Exa + heuristics only | No LLM path | |
| LLM-primary + Exa enrich | Judges may reject as wrapper | |

**User's choice:** `[auto]` Heuristics + Exa + optional LLM
**Notes:** Must demo fully with heuristics when LLM key absent

---

## Exa console

| Option | Description | Selected |
|--------|-------------|----------|
| Dark SOC console + DEMO MODE fallback | Always demoable | ✓ |
| Hard-fail without EXA_API_KEY | Breaks pitch if key missing | |
| Client-side Exa calls | Leaks API key | |

**User's choice:** `[auto]` Server-side `/api/exa` + dark console + DEMO MODE fallback
**Notes:** Key never exposed to client

---

## Visual / mobile baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Dark tech, brand-hero intake, mobile stack | Prize + polish path | ✓ |
| Dashboard-heavy first viewport | Violates brand/hero rules | |
| Light theme enterprise | Off-spec | |

**User's choice:** `[auto]` Dark tech aesthetic, brand-first hero intake, mobile-first stack
**Notes:** Avoid purple-gradient / Inter defaults; honeypot/timeline UI deferred

---

## Honeypot / audio (cross-phase)

| Option | Description | Selected |
|--------|-------------|----------|
| Defer honeypot to Phase 3; audio to Phase 4; Phase 1 teaser only | Sprint order | ✓ |
| Build full honeypot in Phase 1 | Scope creep | |
| Skip audio entirely | Loses skill hook | |

**User's choice:** `[auto]` Teaser only in Phase 1; full honeypot Phase 3; audio Phase 4
**Notes:** Honeypot default remains **simulated** blast (legal/demo-safe) — locked project-wide

---

## the agent's Discretion

- File tree, heuristic weights, Exa SDK vs fetch, loading animations, whether disabled dismantle teaser shows in Phase 1

## Deferred Ideas

- Timeline graph — Phase 2
- Reverse poisoning blast — Phase 3
- ElevenLabs + Render ship — Phase 4
