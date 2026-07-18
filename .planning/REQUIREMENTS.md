# Requirements

See also: `REQUIREMENTS.md` content is mirrored in project active requirements.

## v1 Scope — Cursor Hackathon Ahmedabad 2026

### REQ-01 — App shell
Single Next.js 14+ App Router app, dark Linear/Vercel palette, mobile-first layout, no auth.

### REQ-02 — Evidence intake
Accept sequential text pastes and file uploads; stash in transient client/session array (in-memory).

### REQ-03 — Scan core
Extract URLs; heuristic phishing scoring; optional LLM enrich if `OPENAI_API_KEY` (or equiv) set.

### REQ-04 — Exa threat intel
On link process, call Exa search (news|forum, highlights, numResults: 3); render in dark security console.

### REQ-05 — Attack timeline
Interactive chronological graph of psychological attack stages across stitched evidence drops.

### REQ-06/07 — Reverse poisoning
When risk verified high, unlock Dismantle Attack; run non-blocking async mock-credential blast; live terminal counter.

### REQ-08/09/10 — Ship polish
Render deploy, mobile AI prize polish, ElevenLabs verbal readout (graceful no-key stub).

## Explicitly Out

- Clerk/NextAuth
- Mongo/Postgres/Prisma/Supabase
- Real third-party phishing POST floods as default path
