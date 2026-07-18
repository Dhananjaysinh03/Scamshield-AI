"use client";

import { useMemo, useRef, useState } from "react";
import { EMAIL_DEMOS, type EmailDemoId } from "@/lib/email/demos";
import type { EmailAnalysisResult, EmailVerdict } from "@/lib/email/types";
import type { OcrResponse } from "@/lib/types";

const VERDICT_STYLE: Record<
  EmailVerdict,
  { stamp: string; label: string; className: string; icon: string }
> = {
  phishing: {
    stamp: "PHISHING",
    label: "Treat this as phishing",
    className:
      "border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)]",
    icon: "!",
  },
  suspicious: {
    stamp: "SUSPICIOUS",
    label: "Be careful — verify before you act",
    className:
      "border-[var(--caution-line)] bg-[var(--caution-bg)] text-[var(--caution-ink)]",
    icon: "?",
  },
  safe: {
    stamp: "SAFE-LEANING",
    label: "No strong phishing pattern found",
    className:
      "border-[var(--ok-line)] bg-[var(--ok-bg)] text-[var(--ok-ink)]",
    icon: "✓",
  },
};

function barColor(score: number): string {
  if (score >= 70) return "var(--danger-ink)";
  if (score >= 40) return "var(--caution-ink)";
  return "var(--brand)";
}

export function SimpleCheck() {
  const [text, setText] = useState("");
  const [demoId, setDemoId] = useState<EmailDemoId | null>(null);
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrNote, setOcrNote] = useState<string | null>(null);
  const [officialDomain, setOfficialDomain] = useState("");
  const resultRef = useRef<HTMLElement>(null);

  const canCheck = text.trim().length > 0;
  const verdictUi = result ? VERDICT_STYLE[result.verdict] : null;
  const hasHardStop =
    !!result &&
    (result.preventionLevel === "hard_stop" || result.hardStops.length > 0);

  const factorBars = useMemo(() => {
    if (!result) return [];
    const t = result.technicalFindings;
    return [
      { name: "Sender", score: t.sender.score, w: result.weights.sender },
      { name: "Content", score: t.content.score, w: result.weights.content },
      { name: "Links", score: t.urls.score, w: result.weights.urls },
      {
        name: "Files",
        score: t.attachments.score,
        w: result.weights.attachments,
      },
      {
        name: "Headers",
        score: t.headers.score,
        w: result.weights.headers,
      },
    ];
  }, [result]);

  async function runEmailAnalyze(raw: string, domainOverride?: string) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const domain = (domainOverride ?? officialDomain).trim() || undefined;
      const res = await fetch("/api/email-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          officialDomain: domain,
        }),
      });
      if (!res.ok) throw new Error("Analyze failed");
      const data = (await res.json()) as EmailAnalysisResult;
      setResult(data);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError(
        "Couldn’t check this email. Check your connection and try again.",
      );
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
    if (demo.officialDomain) {
      setOfficialDomain(demo.officialDomain);
    } else if (demo.tone === "safe") {
      setOfficialDomain("");
    }
    void runEmailAnalyze(demo.raw, demo.officialDomain);
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
          setOcrNote("Text from screenshot ready — tap Check email.");
        } else {
          setOcrNote(
            data.message ||
              "Couldn’t read this screenshot. Paste the email text instead.",
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
          <div className="flex w-full items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-base font-bold text-white shadow-sm">
                S
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                  ScamShield
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Email phishing prevention
                </p>
              </div>
            </div>
            <p className="hidden text-sm text-[var(--ink-muted)] md:block">
              Paste → check → HARD STOP if needed
            </p>
          </div>
        </header>

        <main className="w-full min-w-0 overflow-x-clip px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8 xl:px-10">
          <section className="w-full max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-dim)]">
              One problem · one product
            </p>
            <h1 className="font-display mt-2 text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-4xl lg:text-[2.75rem]">
              Got a suspicious email?
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
              Paste it below. We check sender, links, files, and intent — then{" "}
              <strong className="font-semibold text-[var(--ink)]">HARD STOP</strong>{" "}
              before OTP, pay, open file, or remote access.
            </p>
            <p className="pitch-hint mt-4 max-w-3xl">
              Live demo: <strong>Bank OTP</strong> → HARD STOP →{" "}
              <strong>CEO gift virus</strong> → <strong>Temp-mail</strong> →{" "}
              <strong>Normal email</strong> (contrast). We don’t prove From is
              real — we stop irreversible actions.
            </p>
          </section>

          <section className="mt-7 w-full min-w-0 sm:mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-[var(--ink)]">
                  Try an example
                </p>
                <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                  One tap loads and checks it for you.
                </p>
              </div>
            </div>
            <div className="chip-rail mt-3 w-full">
              {EMAIL_DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => runDemo(d.id)}
                  disabled={busy}
                  className={`min-h-[4.25rem] w-[11rem] shrink-0 rounded-2xl border px-3.5 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-50 sm:w-[12.5rem] ${
                    demoId === d.id
                      ? d.tone === "safe"
                        ? "border-[var(--ok-line)] bg-[var(--ok-bg)] shadow-sm"
                        : "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm"
                      : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--brand)]/45"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug text-[var(--ink)] sm:text-[0.95rem]">
                    {d.label}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-snug text-[var(--ink-muted)]">
                    {d.line}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="mt-6 grid w-full min-w-0 gap-5 lg:mt-8 lg:grid-cols-2 lg:items-start lg:gap-8">
            <section className="simple-card w-full min-w-0 p-4 sm:p-6">
              <h2 className="text-lg font-bold text-[var(--ink)]">Your email</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Paste the full message (headers help), or upload a file /
                screenshot.
              </p>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-[var(--ink)]">
                  Company domain{" "}
                  <span className="font-normal text-[var(--ink-muted)]">
                    (optional — catches CEO@gmail)
                  </span>
                </span>
                <input
                  value={officialDomain}
                  onChange={(e) => setOfficialDomain(e.target.value)}
                  placeholder="e.g. acme.com"
                  className="mt-1.5 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--input)] px-4 text-base text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-[var(--ink)]">
                  Email text
                </span>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setDemoId(null);
                  }}
                  rows={11}
                  disabled={busy}
                  placeholder={`From: "Support" <alerts@brand-secure.xyz>\nSubject: Verify now\n\nDear customer...`}
                  className="mt-1.5 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--input)] px-4 py-3.5 font-mono text-sm leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-60"
                />
              </label>

              <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 text-center text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--brand)]/50 hover:text-[var(--ink)]">
                Upload .eml, .txt, or screenshot
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
                className="btn-brand mt-5 min-h-14 w-full rounded-2xl px-5 text-lg font-bold"
              >
                {busy ? "Checking email…" : "Check email"}
              </button>

              {error ? (
                <div
                  className="mt-3 rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-ink)]"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}
            </section>

            <section
              ref={resultRef}
              className="w-full min-w-0 lg:sticky lg:top-[4.5rem]"
            >
              {busy && !result ? (
                <div
                  className="simple-card space-y-3 p-5 sm:p-6"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <p className="text-base font-medium text-[var(--brand-dim)]">
                    Checking sender, links, files, and intent…
                  </p>
                  <div className="h-24 animate-pulse rounded-2xl bg-[var(--input)]" />
                  <div className="h-16 animate-pulse rounded-2xl bg-[var(--input)]" />
                  <div className="h-20 animate-pulse rounded-2xl bg-[var(--input)]" />
                </div>
              ) : null}

              {!busy && !result ? (
                <div className="simple-card flex min-h-[16rem] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[22rem]">
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    Results show up here
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
                    Tap <strong className="text-[var(--ink)]">Bank OTP</strong>{" "}
                    to start — or paste your own email and press Check email.
                  </p>
                </div>
              ) : null}

              {result ? (
                <div className="result-stack space-y-4">
                  {hasHardStop ? (
                    <div className="hard-stop-card" role="alert">
                      <p className="hard-stop-kicker">1 · HARD STOP</p>
                      <p className="mt-1 text-2xl font-extrabold leading-snug">
                        Do not act on this email
                      </p>
                      {result.becTheme ? (
                        <p className="mt-1 text-sm font-semibold opacity-90">
                          Attack theme: {result.becTheme}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-base leading-relaxed opacity-90">
                        This asks for something hard to undo. Verify another way
                        first — call a known number or open the real app, not a
                        link in the email.
                      </p>
                      <ul className="mt-4 space-y-2.5">
                        {(result.hardStops.length
                          ? result.hardStops
                          : [
                              "Do not share OTP, click links, pay, or open attachments until you verify another way.",
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
                              STOP
                            </span>
                            <span className="min-w-0 break-words">
                              {s.replace(/^DO NOT\s+/i, "")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="all-clear-card" role="status">
                      <p className="hard-stop-kicker">1 · No hard stop</p>
                      <p className="mt-1 text-2xl font-extrabold leading-snug">
                        No irreversible phishing lure found
                      </p>
                      <p className="mt-1.5 text-base leading-relaxed opacity-90">
                        Still don’t trust From alone — prefer official apps you
                        open yourself.
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
                          2 · {verdictUi?.stamp} · {result.riskScore}/100 ·{" "}
                          {result.confidence}
                        </p>
                        <p className="mt-1 text-2xl font-extrabold leading-snug">
                          {verdictUi?.label}
                        </p>
                        <p className="mt-2 text-base leading-relaxed">
                          {result.plainSummary}
                        </p>
                        {result.dangerousIntents.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {result.dangerousIntents.map((i) => (
                              <span
                                key={i}
                                className="rounded-full border border-[var(--danger-line)] bg-black/5 px-3 py-1 text-xs font-semibold"
                              >
                                {i.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="simple-card p-5">
                    <p className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
                      <span className="section-num" aria-hidden>
                        3
                      </span>
                      Why we flagged this
                    </p>
                    <ul className="mt-2.5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink)] sm:text-[0.95rem]">
                      {result.reasons.slice(0, 5).map((r) => (
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
                              {f.w ? ` · ${f.w}%` : ""}
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
                      <p className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
                        <span className="section-num" aria-hidden>
                          4
                        </span>
                        How this scam works
                      </p>
                      <ul className="mt-2.5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink)] sm:text-[0.95rem]">
                        {result.learnHow.map((t) => (
                          <li key={t} className="break-words">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="simple-card p-5">
                    <p className="flex items-center gap-2 text-base font-semibold text-[var(--ink)]">
                      <span className="section-num" aria-hidden>
                        5
                      </span>
                      What you should do
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ink)] sm:text-[0.95rem]">
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
          </div>
        </main>
      </div>
    </div>
  );
}
