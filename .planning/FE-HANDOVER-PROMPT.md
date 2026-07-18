# FE Handover Prompt — paste this to your frontend teammate

---

You are the **Frontend owner** for **ScamShield AI** (Cursor Hackathon Ahmedabad / Neural Nexus).

## Repo
https://github.com/Dhananjaysinh03/Scamshield-AI

```bash
git pull origin master
npm install
cp .env.example .env.local   # BE has EXA key locally — you don't need it for UI work
npm run dev
```

## Your mission (next ~2 hours)
Make the **live demo + mobile prize** flawless. **No new product features** unless BE asks. Polish what exists.

### Must do
1. **`git pull`** — latest includes Pitch mode, scenarios, Systems A/B/C badges, Threat Report, ProfileTicker.
2. Rehearse on **375px / phone**:
   - Scenario chips scroll OK
   - **▶ Pitch mode** works end-to-end
   - Timeline selectable
   - Honeypot counter + profile torrent visible
   - Copy threat report works
3. Fix only **UI bugs**: overflow, cut-off buttons, tiny tap targets, spacing, contrast.
4. Time a real **60-second pitch** with Pitch mode. Trim copy if anything feels slow.
5. Commit as `feat(fe): …` and push to `master`.

### Do NOT touch
- `app/api/**`
- `lib/heuristics.ts`, `lib/timeline.ts`, `lib/honeypot.ts`, `lib/audio.ts` (except types if BE asks)
- Env secrets / Render config

### Already wired (hit real APIs)
| UI | API |
|----|-----|
| Scan | `POST /api/scan` |
| Exa console | `POST /api/exa` |
| Timeline | `POST /api/timeline` |
| Honeypot | `POST /api/honeypot/start` + `GET/DELETE /api/honeypot/[jobId]` |
| Audio | `POST /api/audio` |

Mocks: `lib/mocks/config.ts` → `USE_MOCKS = false` (keep false). Fallback mocks only if API fails.

### Own these files
```
components/**
app/page.tsx
app/globals.css
lib/mocks/scenarios.ts   (copy only — don't break shapes)
```

### Pitch script (you speak / BE clicks, or reverse)
1. “Not a ChatGPT wrapper.”
2. Scenario → Pitch mode.
3. **System C** Exa live intel.
4. **System B** timeline stages.
5. **System A** dismantle + counter + fake identities.
6. Copy threat report for judges.

### Done when
- [ ] Phone demo smooth
- [ ] Pitch mode < ~20s to honeypot arming
- [ ] No horizontal overflow at 375px
- [ ] Pushed to GitHub

Questions → ping BE. Ship polish, not scope creep.

---
