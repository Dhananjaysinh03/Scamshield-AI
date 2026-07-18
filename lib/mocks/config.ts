/**
 * Flip per-surface when backend confirms routes are live.
 * Timeline API exists — USE_MOCKS false hits POST /api/timeline (falls back on error).
 * Honeypot / audio still mock until FE-T3 / FE-T4 flip.
 */
export const USE_MOCKS = false;
export const USE_HONEYPOT_MOCKS = true;
export const USE_AUDIO_MOCKS = true;
