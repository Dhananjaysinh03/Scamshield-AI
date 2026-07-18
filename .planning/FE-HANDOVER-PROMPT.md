# FE HANDOVER — Consumer product + technical vault (UPDATED)

## Live product goal
Default UI = **light everyday “Is this a scam?”** (`SimpleCheck`).  
Offensive SOC (Pitch mode, honeypot, Exa, timeline) lives under **Show technical details**.

## Repo
https://github.com/Dhananjaysinh03/Scamshield-AI  
`git pull` — BE already shipped verdict / malware / OCR / SimpleCheck shell.

## Your job now (polish, don’t rebuild engines)
1. Match the light mock tighter (spacing, mint `#5bb89a`, mobile 375px).
2. Improve Step 2 verdict card polish (icons optional, keep plain English).
3. Ensure example chips + “Check this example” feel one-tap.
4. Technical vault: make expand/collapse smooth; Pitch mode still works inside.
5. Dark mode toggle already toggles CSS vars — refine if needed.
6. Commit `feat(fe): polish consumer check flow`

## APIs (ready)
| Call | Use |
|------|-----|
| `POST /api/analyze` | Main check — returns `verdict`, `plainSummary`, `advice`, `malware`, timeline, intel |
| `POST /api/ocr` | Screenshot → `{ text, mode, message? }` (needs `OPENAI_API_KEY` for live OCR) |
| Existing honeypot / timeline / audio | Technical vault only |

## ScanResult fields (use these)
```ts
verdict: "scam" | "likely_scam" | "suspicious" | "clean"
plainSummary: string
advice: string[]
categories: ("phishing"|"payment_fraud"|"malware_lure"|"impersonation")[]
malware: { detected: boolean, indicators: string[] }
```

## Own
`components/SimpleCheck.tsx`, consumer CSS in `globals.css`, vault UX.  
Don’t break `Dashboard` APIs.

## Do not
Touch `app/api/**` or heuristics unless BE asks.
