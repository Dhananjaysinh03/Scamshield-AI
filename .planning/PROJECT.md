# ScamShield AI

## What This Is

An offensive cyber-defense demo for the Cursor Community Hackathon Ahmedabad (2026). Users drop phishing texts, links, or files; ScamShield stitches them into a multi-stage attack timeline, pulls live Exa threat intel, and unlocks a "Reverse Poisoning" honeypot that floods verified phishing form endpoints with high-entropy fake credentials — with live terminal telemetry.

## Core Value

Judges must lean forward: live web forensics + stitched scam timeline + dismantle-attack honeypot — not a passive screenshot-to-LLM wrapper.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] URL/text/file intake with in-memory session state (no auth, no DB)
- [ ] Heuristic + optional LLM risk classification
- [ ] Live Exa threat intel console (news/forum consensus)
- [ ] Multi-stage chronological attack timeline visualization
- [ ] Reverse Poisoning honeypot with live injection counter (simulated blast by default)
- [ ] Mobile-first dark tech UI (Linear/Vercel aesthetic)
- [ ] Deployable to Render as a single Next.js app
- [ ] Optional ElevenLabs verbal security readout when API key present

### Out of Scope

- Authentication / Clerk / NextAuth — wastes hackathon time
- Persistent databases (Mongo/Postgres/Prisma/Supabase) — in-memory only
- Real unsolicited POST floods to third-party phishing sites in production demo — use simulated blast + optional self-hosted sink
- Enterprise multi-tenant admin — not a judged metric

## Context

- **Hackathon:** Cursor Community Hackathon Ahmedabad 2026
- **Team:** Neural Nexus (1 elite Cursor driver + 1 product/pitch)
- **Window:** 4.5 hours (11:00–15:30)
- **Prize focus:** Special Mobile AI Challenge + overall demo impact
- **Canonical product spec:** `.planning/SPEC-SCAMSHIELD.md`

## Constraints

- **Timeline**: 4.5 hours — first-pass executable code only
- **Deploy**: Render, zero-config single-page/app constraints
- **State**: Browser arrays + in-memory server caches only
- **Git**: Short atomic commits after each verified task block
- **Mobile**: Every component must work on mobile viewport

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router + API routes | Single Render deployable | — Pending |
| Simulated honeypot blast (default) | Legal/demo-safe; still shows mic-drop UX | — Pending |
| Heuristics + Exa + optional LLM | Zero-day signal without pure LLM wrapper | — Pending |
| Sprint: scaffold→scan/Exa→timeline→honeypot→polish/audio | Demo-critical path first | — Pending |

---
*Last updated: 2026-07-18 after FAFO discuss bootstrap*
