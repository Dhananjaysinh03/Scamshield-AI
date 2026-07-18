# SPEC — ScamShield AI (Canonical Product Spec)

> Source: Cursor Community Hackathon Ahmedabad 2026 production specification (Neural Nexus).
> Downstream agents MUST treat this as the product source of truth alongside PROJECT.md / REQUIREMENTS.md.

## Mission

Offensive cyber-defense weapon — not a passive AI wrapper. Dominate 4.5h window. Deploy to Render.

## System A — Reverse Poisoning Honeypot

When verified phishing URL/form endpoint detected → unlock "Dismantle Attack" panel.
Server route: concurrent non-blocking async loop synthesizing high-entropy mock profiles (regional names, alphanumeric credentials, bank routing codes, rotating spoofed headers).
Fire rapid async POST streams to phishing form handler to pollute data collection.
**Demo default (locked):** simulate blast + live telemetry (legal/safe). Optional hybrid: real POSTs only to self-hosted mock sink.
UI: live terminal counter — `[Honeypot Active]: Injected N fake credentials. Scammer database corrupted successfully.`

## System B — Stitched Multi-Stage Chronological Timelines

Accept successive text drops / multi-file uploads into transient array.
Visualize premium interactive timeline of psychological attack progression (Urgency Escalation → Authority Impersonation → Financial Extortion).

## System C — Live Web Forensics via Exa

On link process:
```javascript
const response = await exa.search(targetUrl, {
  category: "news | forum",
  contents: { highlights: true },
  numResults: 3
});
```
UI: stream snippets into dark-mode security console — `[Exa Threat Intel]: ...`

## Hard Restrictions

- NO authentication
- NO persistent databases
- Atomic git commits per verified task
- Mobile-first compliance

## Skills Hooks

- `/ui-polish` — premium dark aesthetic, transitions, mobile
- `/exa-query` — Exa async pipelines
- `/audio-alert` — ElevenLabs TTS routes
