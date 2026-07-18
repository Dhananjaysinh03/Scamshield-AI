"use client";

import { useMemo, useRef, useState } from "react";
import {
  EMAIL_DEMOS,
  FEATURED_DEMO_ID,
  type EmailDemoId,
} from "@/lib/email/demos";
import type {
  DangerousIntent,
  EmailAnalysisResult,
  EmailVerdict,
} from "@/lib/email/types";
import type { OcrResponse } from "@/lib/types";

type TabId = "check" | "how";

const VERDICT_STYLE: Record<
  EmailVerdict,
  { stamp: string; label: string; className: string; icon: string }
> = {
  phishing: {
    stamp: "WARNING",
    label: "Treat this as a phishing email",
    className:
      "border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)]",
    icon: "!",
  },
  suspicious: {
    stamp: "BE CAREFUL",
    label: "Something feels off — check before you act",
    className:
      "border-[var(--caution-line)] bg-[var(--caution-bg)] text-[var(--caution-ink)]",
    icon: "?",
  },
  safe: {
    stamp: "LOOKS OKAY",
    label: "No strong warning found",
    className:
      "border-[var(--ok-line)] bg-[var(--ok-bg)] text-[var(--ok-ink)]",
    icon: "✓",
  },
};

const INTENT_LABEL: Record<DangerousIntent, string> = {
  otp: "Wants your OTP",
  payment: "Wants money / payment",
  malware_open: "Wants you to open a file",
  click_verify: "Wants you to tap a link",
  credential_harvest: "Wants your password",
  wire_ceo: "Urgent money request",
  remote_access: "Wants screen / remote access",
  kyc_harvest: "Wants KYC / ID details",
  gift_lure: "Fake gift / prize",
};

const HOW_STEPS = [
  {
    title: "You paste a weird email",
    body: "Copy the message you got (or tap the live demo). You don’t open any virus file — we only read the text.",
  },
  {
    title: "We check several clues",
    body: "Who sent it, what it asks, links, and file names. No single word decides alone.",
  },
  {
    title: "We stop dangerous asks",
    body: "If it wants OTP, money, a file open, or screen share, we show a clear STOP first.",
  },
  {
    title: "You get plain next steps",
    body: "We explain why, teach the scam pattern, and tell you what to do — like open your real bank app yourself.",
  },
];

function barColor(score: number): string {
  if (score >= 70) return "var(--danger-ink)";
  if (score >= 40) return "var(--caution-ink)";
  return "var(--brand)";
}

export function SimpleCheck() {
  const [tab, setTab] = useState<TabId>("check");
  const [text, setText] = useState("");
  const [demoId, setDemoId] = useState<EmailDemoId | null>(null);
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrNote, setOcrNote] = useState<string | null>(null);
  const [showMoreDemos, setShowMoreDemos] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const featured =
    EMAIL_DEMOS.find((d) => d.id === FEATURED_DEMO_ID) || EMAIL_DEMOS[0];
  const otherDemos = EMAIL_DEMOS.filter((d) => d.id !== FEATURED_DEMO_ID);

  const canCheck = text.trim().length > 0;
  const verdictUi = result ? VERDICT_STYLE[result.verdict] : null;
  const hasHardStop =
    !!result &&
    (result.preventionLevel === "hard_stop" || result.hardStops.length > 0);

  const factorBars = useMemo(() => {
    if (!result) return [];
    const t = result.technicalFindings;
    return [
      { name: "Who sent it", score: t.sender.score },
      { name: "What it says", score: t.content.score },
      { name: "Links", score: t.urls.score },
      { name: "Files", score: t.attachments.score },
      {
        name: "Email headers",
        score: t.headers.provided ? t.headers.score : 0,
        note: t.headers.provided ? undefined : "not in paste",
      },
    ];
  }, [result]);

  async function runEmailAnalyze(raw: string) {
    setBusy(true);
    setError(null);
    setResult(null);
    setTab("check");
    try {
      const res = await fetch("/api/email-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) throw new Error("Analyze failed");
      const data = (await res.json()) as EmailAnalysisResult;
      setResult(data);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    } catch {
      setError("Couldn’t check this email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function checkPaste() {
    if (!text.trim()) return;
    setDemoId(null);
    void runEmailAnalyze(text.trim());
  }

  function runDemo(id: EmailDemoId) {
    const demo = EMAIL_DEMOS.find((d) => d.id === id) || EMAIL_DEMOS[0];
    setDemoId(demo.id);
    setText(demo.raw);
    setOcrNote(null);
    void runEmailAnalyze(demo.raw);
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setOcrNote(null);
    setDemoId(null);

    if (
      file.type.startsWith("text/") ||
      /\.(txt|md|eml|csv)$/i.test(file.name)
    ) {
      const content = await file.text();
      setText(content);
      setOcrNote("File loaded — tap Check email.");
      return;
    }

    if (file.type.startsWith("image/")) {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const base64 = btoa(binary);
      setBusy(true);
      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mime: file.type || "image/png",
          }),
        });
        const data = (await res.json()) as OcrResponse;
        if (data.text) {
          setText(data.text);
          setOcrNote("We read the screenshot — tap Check email.");
        } else {
          setOcrNote(
            data.message ||
              "Couldn’t read this photo. Paste the email text instead.",
          );
        }
      } catch {
        setOcrNote("Upload failed. Paste the email text instead.");
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div className="theme-consumer">
      <div className="ss-fit simple-shell w-full overflow-x-clip">
        <header className="simple-header z-20 w-full shrink-0">
          <div className="flex w-full items-center justify-between gap-3 px-3 py-2.5 sm:px-5 lg:px-6 xl:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white shadow-sm">
                S
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold tracking-tight text-[var(--ink)] sm:text-lg">
                  ScamShield
                </p>
                <p className="truncate text-[11px] text-[var(--ink-muted)] sm:text-xs">
                  Check if an email is trying to trick you
                </p>
              </div>
            </div>
            <div className="ss-tabs shrink-0" role="tablist" aria-label="ScamShield">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "check"}
                className="ss-tab"
                onClick={() => setTab("check")}
              >
                Check
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "how"}
                className="ss-tab"
                onClick={() => setTab("how")}
              >
                How it works
              </button>
            </div>
          </div>
        </header>

        <main className="ss-fit-main w-full min-w-0 px-3 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4 lg:px-6 xl:px-8">
          {tab === "how" ? (
            <section
              className="ss-pane mx-auto max-w-3xl space-y-3"
              role="tabpanel"
            >
              <h1 className="font-display text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl">
                How ScamShield works
              </h1>
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                Built for everyday people. We don’t prove the sender is “real” —
                we stop you from doing something you can’t undo.
              </p>
              <div className="simple-card p-4 sm:p-5">
                <ol className="space-y-4">
                  {HOW_STEPS.map((step, i) => (
                    <li key={step.title} className="how-step">
                      <span className="section-num mt-0.5" aria-hidden>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-[var(--ink-muted)]">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="demo-hero">
                <p className="text-sm font-semibold text-[var(--brand-dim)]">
                  See it once
                </p>
                <p className="mt-1 text-base font-bold text-[var(--ink)]">
                  {featured.label}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {featured.line}. Safe demo text only.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runDemo(featured.id)}
                  className="btn-brand mt-3 min-h-11 w-full rounded-2xl px-5 text-base font-bold"
                >
                  {busy && demoId === featured.id
                    ? "Running demo…"
                    : "Run live demo"}
                </button>
              </div>
            </section>
          ) : (
            <section className="ss-workspace" role="tabpanel">
              {/* Left: input */}
              <div className="ss-pane flex min-h-0 flex-col gap-3">
                <div className="shrink-0">
                  <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-2xl lg:text-[1.65rem]">
                    Got a weird email?
                  </h1>
                  <p className="mt-1 text-sm leading-snug text-[var(--ink-muted)]">
                    We’ll tell you if you should{" "}
                    <strong className="font-semibold text-[var(--ink)]">
                      stop — don’t do what this asks
                    </strong>
                    .
                  </p>
                </div>

                <div className="demo-hero shrink-0 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-dim)]">
                        Live demo
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-[var(--ink)] sm:text-base">
                        Fake bank OTP — one tap
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runDemo(featured.id)}
                      className="btn-brand min-h-11 shrink-0 rounded-2xl px-5 text-sm font-bold sm:min-h-12 sm:text-base"
                    >
                      {busy && demoId === featured.id
                        ? "Checking…"
                        : "Try the demo"}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-left text-xs font-semibold text-[var(--brand-dim)]"
                    onClick={() => setShowMoreDemos((v) => !v)}
                  >
                    {showMoreDemos ? "Hide more examples" : "More examples"}
                  </button>
                  {showMoreDemos ? (
                    <div className="chip-rail mt-2">
                      {otherDemos.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => runDemo(d.id)}
                          disabled={busy}
                          className={`min-h-[3.5rem] w-[9.25rem] shrink-0 rounded-2xl border px-2.5 py-2 text-left transition disabled:opacity-50 ${
                            demoId === d.id
                              ? d.tone === "safe"
                                ? "border-[var(--ok-line)] bg-[var(--ok-bg)]"
                                : "border-[var(--brand)] bg-[var(--brand-soft)]"
                              : "border-[var(--line)] bg-[var(--card)]"
                          }`}
                        >
                          <span className="block text-sm font-semibold text-[var(--ink)]">
                            {d.label}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] text-[var(--ink-muted)]">
                            {d.line}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="simple-card flex min-h-0 flex-1 flex-col p-3 sm:p-4">
                  <label className="flex min-h-0 flex-1 flex-col">
                    <span className="shrink-0 text-sm font-medium text-[var(--ink)]">
                      Or paste your own email
                    </span>
                    <textarea
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setDemoId(null);
                      }}
                      disabled={busy}
                      placeholder={`From: ...\nSubject: ...\n\nPaste the message you received`}
                      className="ss-textarea mt-1.5 w-full flex-1 resize-none rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 py-3 text-sm leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-60"
                    />
                  </label>

                  <div className="mt-2.5 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-3 text-center text-xs font-medium text-[var(--ink-muted)] transition hover:border-[var(--brand)]/50 hover:text-[var(--ink)] sm:text-sm">
                      Upload photo / .eml
                      <input
                        type="file"
                        accept="image/*,.txt,.eml,.md"
                        className="sr-only"
                        disabled={busy}
                        onChange={(e) => {
                          void onUpload(e.target.files?.[0] ?? null);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={checkPaste}
                      disabled={!canCheck || busy}
                      className="btn-brand min-h-11 flex-[1.2] rounded-2xl px-4 text-base font-bold sm:min-h-12"
                    >
                      {busy && !demoId ? "Checking…" : "Check email"}
                    </button>
                  </div>
                  {ocrNote ? (
                    <p className="mt-2 shrink-0 text-xs text-[var(--brand-dim)] sm:text-sm">
                      {ocrNote}
                    </p>
                  ) : null}
                  {error ? (
                    <div
                      className="mt-2 shrink-0 rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-ink)]"
                      role="alert"
                    >
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right: results — fills remaining screen */}
              <section
                ref={resultRef}
                className="ss-pane min-h-0 min-w-0"
              >
                {busy && !result ? (
                  <div
                    className="simple-card flex h-full min-h-[12rem] flex-col justify-center space-y-3 p-5"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <p className="text-base font-medium text-[var(--brand-dim)]">
                      Checking the email…
                    </p>
                    <div className="h-16 animate-pulse rounded-2xl bg-[var(--input)]" />
                    <div className="h-12 animate-pulse rounded-2xl bg-[var(--input)]" />
                  </div>
                ) : null}

                {!busy && !result ? (
                  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-5 py-8 text-center lg:min-h-0">
                    <p className="text-base font-semibold text-[var(--ink)]">
                      Results show here
                    </p>
                    <p className="mt-2 max-w-xs text-sm text-[var(--ink-muted)]">
                      Tap{" "}
                      <strong className="text-[var(--ink)]">Try the demo</strong>{" "}
                      or paste an email and check.
                    </p>
                  </div>
                ) : null}

                {result ? (
                  <div className="result-stack space-y-3 pb-1">
                    {hasHardStop ? (
                      <div className="hard-stop-card" role="alert">
                        <p className="hard-stop-kicker">Stop first</p>
                        <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                          Don’t do what this email asks
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed opacity-90 sm:text-base">
                          Open your real bank / app yourself, or call a number
                          you already know — not a link from this email.
                        </p>
                        <ul className="mt-3 space-y-2">
                          {(result.hardStops.length
                            ? result.hardStops
                            : [
                                "Do not share OTP, click links, pay, or open attachments.",
                              ]
                          ).map((s) => (
                            <li
                              key={s}
                              className="flex gap-2.5 rounded-xl bg-black/5 px-3 py-2.5 text-sm font-semibold leading-snug sm:text-base"
                            >
                              <span
                                className="mt-0.5 shrink-0 rounded bg-[var(--danger-ink)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                                aria-hidden
                              >
                                No
                              </span>
                              <span className="min-w-0 break-words">
                                {s
                                  .replace(/^DO NOT\s+/i, "")
                                  .replace(/^SAFE NEXT STEP:\s*/i, "")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="all-clear-card" role="status">
                        <p className="hard-stop-kicker">Looks safer</p>
                        <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                          No strong trap found
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed opacity-90 sm:text-base">
                          Still be careful with unexpected links. When unsure,
                          ask someone you trust.
                        </p>
                      </div>
                    )}

                    <div
                      className={`verdict-card rounded-2xl border px-4 py-4 sm:px-5 ${verdictUi?.className}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="verdict-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                          aria-hidden
                        >
                          {verdictUi?.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                            {verdictUi?.stamp} · score {result.riskScore}/100
                          </p>
                          <p className="mt-1 text-lg font-extrabold leading-snug sm:text-xl">
                            {verdictUi?.label}
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed sm:text-base">
                            {result.plainSummary
                              .replace(/^PHISHING[^.]*\.\s*/i, "")
                              .replace(/^Suspicious\s*—\s*/i, "")}
                          </p>
                          {result.dangerousIntents.length > 0 ? (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {result.dangerousIntents.map((i) => (
                                <span
                                  key={i}
                                  className="rounded-full border border-[var(--danger-line)] bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold"
                                >
                                  {INTENT_LABEL[i] || i.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="simple-card p-4">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          Why we say that
                        </p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink)]">
                          {result.reasons.slice(0, 4).map((r) => (
                            <li key={r} className="break-words">
                              {r}
                            </li>
                          ))}
                        </ul>
                        <ul className="mt-3 space-y-2">
                          {factorBars.map((f) => (
                            <li key={f.name}>
                              <div className="flex justify-between text-[11px] text-[var(--ink-muted)]">
                                <span>
                                  {f.name}
                                  {f.note ? ` (${f.note})` : ""}
                                </span>
                                <span>{f.score}/100</span>
                              </div>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--input)]">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, f.score)}%`,
                                    background: barColor(f.score),
                                  }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        {result.learnHow?.length ? (
                          <div className="simple-card p-4">
                            <p className="text-sm font-semibold text-[var(--ink)]">
                              Remember for next time
                            </p>
                            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink)]">
                              {result.learnHow.slice(0, 3).map((t) => (
                                <li key={t} className="break-words">
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <div className="simple-card p-4">
                          <p className="text-sm font-semibold text-[var(--ink)]">
                            What to do now
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--ink)]">
                            {result.recommendedActions.map((a) => (
                              <li
                                key={a}
                                className="flex gap-2 rounded-xl bg-[var(--input)] px-2.5 py-2"
                              >
                                <span
                                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand-dim)]"
                                  aria-hidden
                                >
                                  ✓
                                </span>
                                <span className="min-w-0 break-words">{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
