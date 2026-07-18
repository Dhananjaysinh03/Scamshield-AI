"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
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
    label: "Be careful — something’s off",
    className:
      "border-[var(--caution-line)] bg-[var(--caution-bg)] text-[var(--caution-ink)]",
    icon: "?",
  },
  safe: {
    stamp: "SAFE",
    label: "Looks safe-leaning",
    className:
      "border-[var(--ok-line)] bg-[var(--ok-bg)] text-[var(--ok-ink)]",
    icon: "✓",
  },
};

function barColor(score: number): string {
  if (score >= 70) return "var(--bar-hot)";
  if (score >= 40) return "var(--bar-warm)";
  return "var(--brand)";
}

export function SimpleCheck() {
  const [text, setText] = useState("");
  const [demoId, setDemoId] = useState<EmailDemoId>("ceo_fraud");
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [dark, setDark] = useState(false);
  const [ocrNote, setOcrNote] = useState<string | null>(null);
  const [officialDomain, setOfficialDomain] = useState("");
  const resultRef = useRef<HTMLElement>(null);

  const canCheck = text.trim().length > 0;
  const verdictUi = result ? VERDICT_STYLE[result.verdict] : null;

  const factorBars = useMemo(() => {
    if (!result) return [];
    const t = result.technicalFindings;
    const w = result.weights;
    return [
      {
        name: "Sender",
        detail: "Who claims to write",
        score: t.sender.score,
        weight: `${w.sender}%`,
      },
      {
        name: "Content",
        detail: "Pressure & intent",
        score: t.content.score,
        weight: `${w.content}%`,
      },
      {
        name: "Links",
        detail: "Where clicks go",
        score: t.urls.score,
        weight: `${w.urls}%`,
      },
      {
        name: "Attachments",
        detail: "Files / malware lures",
        score: t.attachments.score,
        weight: `${w.attachments}%`,
      },
      {
        name: "Headers",
        detail: t.headers.provided ? "SPF / DKIM / DMARC" : "Not in paste",
        score: t.headers.score,
        weight: t.headers.provided ? `${w.headers}%` : "skipped",
      },
    ];
  }, [result]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("scamshield-simple-theme");
      if (stored === "dark") setDark(true);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleDark() {
    setDark((d) => {
      const next = !d;
      try {
        localStorage.setItem(
          "scamshield-simple-theme",
          next ? "dark" : "light",
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function runEmailAnalyze(raw: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/email-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          officialDomain: officialDomain.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Analyze failed");
      const data = (await res.json()) as EmailAnalysisResult;
      setResult(data);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function checkPaste() {
    if (!text.trim()) return;
    void runEmailAnalyze(text.trim());
  }

  function previewDemo(id: EmailDemoId) {
    const demo = EMAIL_DEMOS.find((d) => d.id === id) || EMAIL_DEMOS[0];
    setDemoId(demo.id);
    setText(demo.raw);
    setResult(null);
    setError(null);
    setShowJson(false);
  }

  function checkDemo(id: EmailDemoId = demoId) {
    const demo = EMAIL_DEMOS.find((d) => d.id === id) || EMAIL_DEMOS[0];
    setDemoId(demo.id);
    setText(demo.raw);
    void runEmailAnalyze(demo.raw);
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setOcrNote(null);

    if (
      file.type.startsWith("text/") ||
      /\.(txt|md|eml|csv)$/i.test(file.name)
    ) {
      const content = await file.text();
      setText(content);
      setOcrNote("Loaded file — tap Check email.");
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
          setOcrNote("Screenshot text extracted — tap Check email.");
        } else {
          setOcrNote(
            data.message ||
              "Couldn’t read this screenshot. Paste the email text instead.",
          );
        }
      } catch {
        setOcrNote("Upload failed.");
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div className={dark ? "theme-soc" : "theme-consumer"}>
      <div className="simple-shell min-h-screen">
        <header className="simple-header sticky top-0 z-20">
          <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white shadow-sm sm:h-10 sm:w-10">
                S
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold tracking-tight text-[var(--ink)] sm:text-lg">
                  ScamShield
                </p>
                <p className="hidden text-[11px] text-[var(--ink-muted)] sm:block">
                  Multi-factor email guard
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--line)] bg-[var(--card)] px-3.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--brand)]/40 hover:text-[var(--ink)] sm:px-4"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <main className="w-full px-4 pb-20 pt-5 sm:px-6 sm:pt-8 lg:px-8 xl:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-dim)]">
            Sender · content · links · files · headers
          </p>
          <h1 className="mt-2 max-w-3xl text-[1.75rem] font-extrabold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-4xl lg:text-5xl">
            Is this email trying to trap you?
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
            Bypass one keyword and you can still fail{" "}
            <strong className="font-semibold text-[var(--ink)]">
              sender + link + attachment + intent
            </strong>
            . We explain every factor — and stop OTP / pay / open-file.
          </p>

          {/* Demos */}
          <section className="simple-card mt-6 p-4 sm:mt-8 sm:p-6">
            <p className="text-sm font-semibold text-[var(--ink)]">
              Try a known attack
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Tap a card to load · tap{" "}
              <span className="font-medium text-[var(--ink)]">
                Check this example
              </span>{" "}
              to analyze.
            </p>
            <div className="chip-rail mt-3.5 sm:grid sm:grid-cols-3 sm:gap-2.5 sm:overflow-visible">
              {EMAIL_DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => previewDemo(d.id)}
                  onDoubleClick={() => checkDemo(d.id)}
                  disabled={busy}
                  className={`min-h-14 w-[11.5rem] shrink-0 rounded-2xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-50 sm:w-auto ${
                    demoId === d.id
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm"
                      : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--brand)]/45"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug text-[var(--ink)]">
                    {d.label}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-snug text-[var(--ink-muted)]">
                    {d.line}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => checkDemo()}
              disabled={busy}
              className="btn-brand mt-4 min-h-12 w-full rounded-2xl px-5 text-base font-semibold sm:w-auto"
            >
              {busy ? "Analyzing…" : "Check this example"}
            </button>
          </section>

          <div className="mt-5 grid gap-5 sm:mt-7 sm:gap-6 xl:grid-cols-2">
            {/* Step 1 */}
            <section className="simple-card p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="step-num" aria-hidden>
                  1
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                    Paste the email
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                    Headers + body is best. We never invent SPF if headers
                    aren’t there.
                  </p>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-medium text-[var(--ink-muted)]">
                  Your real company domain{" "}
                  <span className="font-normal">(optional)</span>
                </span>
                <input
                  value={officialDomain}
                  onChange={(e) => setOfficialDomain(e.target.value)}
                  placeholder="acme.com"
                  className="mt-1.5 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
                />
                <span className="mt-1 block text-[11px] leading-snug text-[var(--ink-muted)]">
                  Catches “CEO” writing from Gmail instead of @acme.com
                </span>
              </label>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={11}
                placeholder={`From: "Support" <alerts@brand-secure.xyz>\nSubject: Verify now\n\nDear customer...`}
                className="mt-3 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 py-3.5 font-mono text-[11px] leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30 sm:text-sm"
              />

              <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 text-sm text-[var(--ink-muted)] transition hover:border-[var(--brand)]/50 hover:text-[var(--ink)]">
                Upload .eml / .txt / screenshot
                <input
                  type="file"
                  accept="image/*,.txt,.eml,.md"
                  className="sr-only"
                  onChange={(e) => {
                    void onUpload(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
              {ocrNote ? (
                <p className="mt-2 text-sm text-[var(--ink-muted)]">{ocrNote}</p>
              ) : null}

              <button
                type="button"
                onClick={checkPaste}
                disabled={!canCheck || busy}
                className="btn-brand mt-4 min-h-12 w-full rounded-2xl px-5 text-base font-bold"
              >
                {busy ? "Running multi-factor analysis…" : "Check email"}
              </button>
              {error ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : null}
            </section>

            <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
              {/* Step 2 */}
              <section ref={resultRef} className="simple-card p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="step-num" aria-hidden>
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                      Verdict
                    </h2>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      SAFE · SUSPICIOUS · PHISHING — with factor scores.
                    </p>
                  </div>
                </div>

                {!result ? (
                  <p className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
                    Paste an email and tap Check — we’ll score each factor.
                  </p>
                ) : (
                  <div className="mt-5 space-y-5">
                    <div
                      className={`verdict-card rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${verdictUi?.className}`}
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
                            {verdictUi?.stamp} · {result.riskScore}/100 ·{" "}
                            {result.confidence} confidence
                          </p>
                          <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                            {verdictUi?.label}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed sm:text-[0.95rem]">
                            {result.plainSummary}
                          </p>
                          {result.scamType.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {result.scamType.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-medium dark:bg-white/10"
                                >
                                  {t.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {result.dangerousIntents.length > 0 ? (
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          What they’re pushing you to do
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {result.dangerousIntents.map((i) => (
                            <span
                              key={i}
                              className="rounded-full border border-[var(--danger-line)] bg-[var(--danger-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--danger-ink)]"
                            >
                              {i.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Why (explained)
                      </p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink)]">
                        {result.reasons.slice(0, 6).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Factor scores
                      </p>
                      <ul className="mt-3 space-y-3">
                        {factorBars.map((f) => (
                          <li key={f.name}>
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                              <span className="min-w-0">
                                <span className="font-semibold text-[var(--ink)]">
                                  {f.name}
                                </span>
                                <span className="ml-1.5 text-[var(--ink-muted)]">
                                  {f.detail} · {f.weight}
                                </span>
                              </span>
                              <span className="shrink-0 tabular-nums font-semibold text-[var(--ink)]">
                                {f.score}
                              </span>
                            </div>
                            <div className="factor-track mt-1.5">
                              <div
                                className="factor-fill"
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
                  </div>
                )}
              </section>

              {/* Step 3 */}
              <section className="simple-card p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="step-num" aria-hidden>
                    3
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                      What not to do
                    </h2>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      Plain stop/go advice after the check.
                    </p>
                  </div>
                </div>

                {result ? (
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
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
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-[var(--ink-muted)]">
                    Advice appears after you check an email.
                  </p>
                )}

                {result ? (
                  <button
                    type="button"
                    onClick={() => setShowJson((v) => !v)}
                    className="mt-4 min-h-11 text-sm font-semibold text-[var(--brand-dim)] underline-offset-4 hover:underline"
                  >
                    {showJson ? "Hide" : "Show"} technical JSON
                  </button>
                ) : null}
                {showJson && result ? (
                  <pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-zinc-950 p-3 text-[10px] leading-relaxed text-emerald-100/90 sm:max-h-72">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowTech((v) => !v)}
                  aria-expanded={showTech}
                  className="mt-3 block min-h-11 text-sm font-semibold text-[var(--brand-dim)] underline-offset-4 hover:underline"
                >
                  {showTech
                    ? "Hide offensive toolkit"
                    : "Show offensive toolkit (optional)"}
                </button>
              </section>
            </div>
          </div>

          <div
            className={`tech-vault-wrap mt-8 sm:mt-10 ${showTech ? "is-open" : ""}`}
          >
            <div className="tech-vault-inner">
              <section className="tech-vault overflow-hidden rounded-2xl border border-zinc-800">
                <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  Optional vault · Exa · timeline · honeypot
                </div>
                <div className="bg-zinc-950 px-3 py-6 sm:px-6">
                  {showTech ? <Dashboard /> : null}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
