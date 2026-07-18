"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { EMAIL_DEMOS, type EmailDemoId } from "@/lib/email/demos";
import type { EmailAnalysisResult, EmailVerdict } from "@/lib/email/types";
import type { OcrResponse } from "@/lib/types";

const VERDICT_STYLE: Record<
  EmailVerdict,
  { label: string; className: string; icon: string }
> = {
  phishing: {
    label: "This looks like phishing",
    className:
      "border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)]",
    icon: "!",
  },
  suspicious: {
    label: "Looks suspicious",
    className:
      "border-[var(--caution-line)] bg-[var(--caution-bg)] text-[var(--caution-ink)]",
    icon: "?",
  },
  safe: {
    label: "Safe-leaning",
    className:
      "border-[var(--ok-line)] bg-[var(--ok-bg)] text-[var(--ok-ink)]",
    icon: "✓",
  },
};

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
    return [
      { name: "Sender identity", score: t.sender.score, weight: "25%" },
      { name: "Content / pressure", score: t.content.score, weight: "20%" },
      { name: "Links", score: t.urls.score, weight: "20%" },
      { name: "Attachments", score: t.attachments.score, weight: "20%" },
      {
        name: "Headers (SPF/DKIM/DMARC)",
        score: t.headers.score,
        weight: t.headers.provided ? "15%" : "0% (not provided)",
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
          <div className="flex w-full items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white shadow-sm">
                S
              </span>
              <span className="truncate text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
                ScamShield
              </span>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--brand)]/40 hover:text-[var(--ink)]"
            >
              {dark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </header>

        <main className="w-full px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-8 xl:px-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-dim)]">
            Multi-factor email guard
          </p>
          <h1 className="mt-2 max-w-3xl text-[1.85rem] font-extrabold leading-[1.15] tracking-tight text-[var(--ink)] sm:text-5xl">
            Is this email trying to trap you?
          </h1>
          <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            We don&apos;t guess from one keyword. We score{" "}
            <strong className="text-[var(--ink)]">sender identity</strong>,{" "}
            <strong className="text-[var(--ink)]">pressure tactics</strong>,{" "}
            <strong className="text-[var(--ink)]">links</strong>,{" "}
            <strong className="text-[var(--ink)]">attachments</strong>, and{" "}
            <strong className="text-[var(--ink)]">headers</strong> (when
            present) — then tell you what <em>not</em> to do next.
          </p>

          <section className="simple-card mt-7 p-4 sm:mt-8 sm:p-6">
            <p className="text-sm font-semibold text-[var(--ink)] sm:text-base">
              Try a known attack pattern
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
              Tap a card to load it, or tap{" "}
              <span className="font-medium text-[var(--ink)]">
                Check this example
              </span>{" "}
              to run multi-factor analysis in one go.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {EMAIL_DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => previewDemo(d.id)}
                  onDoubleClick={() => checkDemo(d.id)}
                  disabled={busy}
                  className={`min-h-14 rounded-2xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-50 ${
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

          <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-2">
            <section className="simple-card p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="step-num" aria-hidden>
                  1
                </span>
                <div>
                  <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                    Paste the email
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                    Full headers + body is best. Subject/From lines alone still
                    work — we won&apos;t invent SPF results.
                  </p>
                </div>
              </div>
              <label className="mt-4 block text-xs font-medium text-[var(--ink-muted)]">
                Official company domain (optional — catches CEO@gmail)
                <input
                  value={officialDomain}
                  onChange={(e) => setOfficialDomain(e.target.value)}
                  placeholder="acme.com"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
                />
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder={`From: "Support" <alerts@brand-secure.xyz>\nSubject: Verify now\n\nDear customer...`}
                className="mt-3 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 py-3.5 font-mono text-xs leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30 sm:text-sm"
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

            <div className="flex flex-col gap-5 sm:gap-6">
              <section ref={resultRef} className="simple-card p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="step-num" aria-hidden>
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                      Verdict
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                      SAFE, SUSPICIOUS, or PHISHING — with explained factors.
                    </p>
                  </div>
                </div>

                {!result ? (
                  <p className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
                    Result appears after analysis — with multi-factor scores.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
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
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                            {result.verdict.toUpperCase()} · score{" "}
                            {result.riskScore}/100 · confidence{" "}
                            {result.confidence}
                          </p>
                          <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                            {verdictUi?.label}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed sm:text-[0.95rem]">
                            {result.plainSummary}
                          </p>
                          {result.scamType.length > 0 ? (
                            <p className="mt-2 text-xs font-medium">
                              Types: {result.scamType.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Why (multi-factor)
                      </p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink)]">
                        {result.reasons.slice(0, 5).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Factor scores
                      </p>
                      <ul className="mt-2 space-y-2">
                        {factorBars.map((f) => (
                          <li key={f.name}>
                            <div className="flex justify-between text-xs text-[var(--ink-muted)]">
                              <span>
                                {f.name}{" "}
                                <span className="opacity-70">({f.weight})</span>
                              </span>
                              <span>{f.score}/100</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--input)]">
                              <div
                                className="h-full rounded-full bg-[var(--brand)]"
                                style={{ width: `${f.score}%` }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </section>

              <section className="simple-card p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="step-num" aria-hidden>
                    3
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                      What you should do
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                      Clear stop/go advice after the check.
                    </p>
                  </div>
                </div>
                {result ? (
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
                    {result.recommendedActions.map((a) => (
                      <li key={a} className="flex gap-2.5">
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
                    Clear stop/go advice after the check.
                  </p>
                )}

                {result ? (
                  <button
                    type="button"
                    onClick={() => setShowJson((v) => !v)}
                    className="mt-4 text-sm font-semibold text-[var(--brand-dim)]"
                  >
                    {showJson ? "Hide" : "Show"} technical JSON
                  </button>
                ) : null}
                {showJson && result ? (
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-zinc-950 p-3 text-[10px] text-emerald-100/90">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowTech((v) => !v)}
                  aria-expanded={showTech}
                  className="mt-5 min-h-11 text-sm font-semibold text-[var(--brand-dim)] underline-offset-4 hover:underline"
                >
                  {showTech
                    ? "Hide offensive toolkit"
                    : "Show offensive toolkit (Exa / timeline / honeypot)"}
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
                  Optional vault · not the core claim — live intel & dismantle
                  demo
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
