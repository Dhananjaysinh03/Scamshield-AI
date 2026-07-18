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
    stamp: "DANGEROUS",
    label: "This looks like a scam email",
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
    label: "No strong scam warning found",
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
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <div className="simple-shell min-h-screen w-full overflow-x-clip">
        <header className="simple-header sticky top-0 z-20 w-full">
          <div className="flex w-full items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-base font-bold text-white shadow-sm">
              S
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                ScamShield
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                Check if an email is trying to trick you
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-xl min-w-0 px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
          <h1 className="font-display text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-[var(--ink)] sm:text-3xl">
            Got a weird email?
          </h1>
          <p className="mt-2 text-base leading-relaxed text-[var(--ink-muted)]">
            Paste it here. We’ll tell you in plain words if you should stop —
            before OTP, money, files, or screen share.
          </p>

          <div className="ss-tabs mt-5" role="tablist" aria-label="ScamShield">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "check"}
              className="ss-tab"
              onClick={() => setTab("check")}
            >
              Check email
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

          {tab === "how" ? (
            <section className="mt-5 space-y-4" role="tabpanel">
              <div className="simple-card p-5">
                <p className="text-lg font-bold text-[var(--ink)]">
                  How ScamShield works
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-muted)]">
                  Built for everyday people. We don’t prove the sender is “real”
                  — we stop you from doing something you can’t undo.
                </p>
                <ol className="mt-5 space-y-5">
                  {HOW_STEPS.map((step, i) => (
                    <li key={step.title} className="how-step">
                      <span className="section-num mt-0.5" aria-hidden>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
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
                <p className="mt-1 text-lg font-bold text-[var(--ink)]">
                  {featured.label}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {featured.line}. Safe demo text only — nothing installs on your
                  phone.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runDemo(featured.id)}
                  className="btn-brand mt-4 min-h-12 w-full rounded-2xl px-5 text-base font-bold"
                >
                  {busy && demoId === featured.id
                    ? "Running demo…"
                    : "Run live demo"}
                </button>
              </div>
            </section>
          ) : (
            <section className="mt-5 space-y-5" role="tabpanel">
              <div className="demo-hero">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-dim)]">
                  Live demo
                </p>
                <p className="mt-1.5 text-xl font-extrabold leading-snug text-[var(--ink)]">
                  Watch ScamShield catch a fake bank email
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                  Example: “Confirm OTP or your account freezes.” One tap loads
                  it and shows the STOP — we never open a real virus.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runDemo(featured.id)}
                  className="btn-brand mt-4 min-h-14 w-full rounded-2xl px-5 text-lg font-bold"
                >
                  {busy && demoId === featured.id
                    ? "Checking demo…"
                    : "Try the demo"}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full text-center text-sm font-semibold text-[var(--brand-dim)]"
                  onClick={() => setShowMoreDemos((v) => !v)}
                >
                  {showMoreDemos ? "Hide more examples" : "More examples"}
                </button>
                {showMoreDemos ? (
                  <div className="chip-rail mt-3">
                    {otherDemos.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => runDemo(d.id)}
                        disabled={busy}
                        className={`min-h-[3.75rem] w-[9.75rem] shrink-0 rounded-2xl border px-3 py-2 text-left transition disabled:opacity-50 ${
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

              <div className="simple-card p-4 sm:p-5">
                <label className="block">
                  <span className="text-sm font-medium text-[var(--ink)]">
                    Or paste your own email
                  </span>
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setDemoId(null);
                    }}
                    rows={8}
                    disabled={busy}
                    placeholder={`From: ...\nSubject: ...\n\nPaste the message you received`}
                    className="mt-1.5 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--input)] px-4 py-3.5 text-base leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-60"
                  />
                </label>

                <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 text-center text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--brand)]/50 hover:text-[var(--ink)]">
                  Or upload a photo / .eml file
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
                {ocrNote ? (
                  <p className="mt-2 text-sm text-[var(--brand-dim)]">{ocrNote}</p>
                ) : null}

                <button
                  type="button"
                  onClick={checkPaste}
                  disabled={!canCheck || busy}
                  className="btn-brand mt-4 min-h-14 w-full rounded-2xl px-5 text-lg font-bold"
                >
                  {busy && !demoId ? "Checking…" : "Check email"}
                </button>

                {error ? (
                  <div
                    className="mt-3 rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-ink)]"
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}
              </div>

              <section ref={resultRef} className="min-w-0">
                {busy && !result ? (
                  <div
                    className="simple-card space-y-3 p-5"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    <p className="text-base font-medium text-[var(--brand-dim)]">
                      Checking the email…
                    </p>
                    <div className="h-20 animate-pulse rounded-2xl bg-[var(--input)]" />
                    <div className="h-14 animate-pulse rounded-2xl bg-[var(--input)]" />
                  </div>
                ) : null}

                {!busy && !result ? (
                  <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-5 py-10 text-center">
                    <p className="text-base font-semibold text-[var(--ink)]">
                      Your result will show here
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      Tap <strong className="text-[var(--ink)]">Try the demo</strong>{" "}
                      above to see how it works.
                    </p>
                  </div>
                ) : null}

                {result ? (
                  <div className="result-stack space-y-4">
                    {hasHardStop ? (
                      <div className="hard-stop-card" role="alert">
                        <p className="hard-stop-kicker">Stop first</p>
                        <p className="mt-1 text-2xl font-extrabold leading-snug">
                          Don’t do what this email asks
                        </p>
                        {result.becTheme ? (
                          <p className="mt-1 text-sm font-semibold opacity-90">
                            Looks like: {result.becTheme}
                          </p>
                        ) : null}
                        <p className="mt-2 text-base leading-relaxed opacity-90">
                          Open your real bank / app yourself, or call a number
                          you already know — not a link from this email.
                        </p>
                        <ul className="mt-4 space-y-2.5">
                          {(result.hardStops.length
                            ? result.hardStops
                            : [
                                "Do not share OTP, click links, pay, or open attachments.",
                              ]
                          ).map((s) => (
                            <li
                              key={s}
                              className="flex gap-3 rounded-xl bg-black/5 px-3.5 py-3 text-base font-semibold leading-snug"
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
                        <p className="mt-1 text-2xl font-extrabold leading-snug">
                          We didn’t find a strong scam trap
                        </p>
                        <p className="mt-2 text-base leading-relaxed opacity-90">
                          Still be careful with unexpected links. When unsure,
                          ask someone you trust.
                        </p>
                      </div>
                    )}

                    <div
                      className={`verdict-card rounded-2xl border px-5 py-5 ${verdictUi?.className}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className="verdict-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold"
                          aria-hidden
                        >
                          {verdictUi?.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                            {verdictUi?.stamp} · score {result.riskScore}/100
                          </p>
                          <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                            {verdictUi?.label}
                          </p>
                          <p className="mt-2 text-base leading-relaxed">
                            {result.plainSummary
                              .replace(/^PHISHING[^.]*\.\s*/i, "")
                              .replace(/^Suspicious\s*—\s*/i, "")}
                          </p>
                          {result.dangerousIntents.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {result.dangerousIntents.map((i) => (
                                <span
                                  key={i}
                                  className="rounded-full border border-[var(--danger-line)] bg-black/5 px-3 py-1 text-xs font-semibold"
                                >
                                  {INTENT_LABEL[i] || i.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="simple-card p-5">
                      <p className="text-base font-semibold text-[var(--ink)]">
                        Why we say that
                      </p>
                      <ul className="mt-2.5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
                        {result.reasons.slice(0, 4).map((r) => (
                          <li key={r} className="break-words">
                            {r}
                          </li>
                        ))}
                      </ul>
                      <ul className="mt-4 space-y-2.5">
                        {factorBars.map((f) => (
                          <li key={f.name}>
                            <div className="flex justify-between text-xs text-[var(--ink-muted)]">
                              <span>
                                {f.name}
                                {f.note ? ` (${f.note})` : ""}
                              </span>
                              <span>{f.score}/100</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--input)]">
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

                    {result.learnHow?.length ? (
                      <div className="simple-card p-5">
                        <p className="text-base font-semibold text-[var(--ink)]">
                          Remember for next time
                        </p>
                        <ul className="mt-2.5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
                          {result.learnHow.slice(0, 4).map((t) => (
                            <li key={t} className="break-words">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="simple-card p-5">
                      <p className="text-base font-semibold text-[var(--ink)]">
                        What to do now
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
                        {result.recommendedActions.map((a) => (
                          <li
                            key={a}
                            className="flex gap-2.5 rounded-xl bg-[var(--input)] px-3 py-2.5"
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
                ) : null}
              </section>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
