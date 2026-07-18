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
  const [demoId, setDemoId] = useState<EmailDemoId | null>("bank_otp");
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
        "Couldn’t analyze this email. Check your connection and try again.",
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
    if (demo.officialDomain) setOfficialDomain(demo.officialDomain);
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
        setOcrNote("Upload failed. Paste the email text instead.");
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div className="theme-consumer">
      <div className="simple-shell min-h-screen overflow-x-clip">
        <header className="simple-header sticky top-0 z-20">
          <div className="flex w-full items-center gap-2.5 px-4 py-3 sm:px-6 lg:px-8">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white shadow-sm">
              S
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-[var(--ink)]">
                ScamShield
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Email phishing prevention
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-xl min-w-0 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-dim)]">
            One problem · one product
          </p>
          <h1 className="mt-2 text-[1.65rem] font-extrabold leading-[1.15] tracking-tight text-[var(--ink)] sm:text-3xl">
            Stop email phishing before you click, pay, or share OTP
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-[0.95rem]">
            Paste a suspicious email. We score sender + links + files + intent,
            then{" "}
            <strong className="font-semibold text-[var(--ink)]">HARD STOP</strong>{" "}
            irreversible actions — and teach you the pattern.
          </p>

          <section className="mt-6">
            <p className="text-sm font-semibold text-[var(--ink)]">
              Try a known attack
            </p>
            <div className="chip-rail mt-2.5 -mx-1 px-1">
              {EMAIL_DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => runDemo(d.id)}
                  disabled={busy}
                  className={`min-h-12 w-[9.5rem] shrink-0 rounded-2xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-50 sm:w-[11rem] ${
                    demoId === d.id
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm"
                      : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--brand)]/45"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug text-[var(--ink)]">
                    {d.label}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-[var(--ink-muted)]">
                    {d.line}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="simple-card mt-5 p-4 sm:p-5">
            <label className="block">
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Official company domain{" "}
                <span className="font-normal">
                  (optional — catches CEO@gmail)
                </span>
              </span>
              <input
                value={officialDomain}
                onChange={(e) => setOfficialDomain(e.target.value)}
                placeholder="acme.com"
                className="mt-1.5 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              />
            </label>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setDemoId(null);
              }}
              rows={8}
              disabled={busy}
              placeholder={`From: "Support" <alerts@brand-secure.xyz>\nSubject: Verify now\n\nDear customer...`}
              className="mt-3 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 py-3 font-mono text-[11px] leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-60 sm:text-sm"
            />

            <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 text-center text-sm text-[var(--ink-muted)] transition hover:border-[var(--brand)]/50 hover:text-[var(--ink)]">
              Upload .eml / .txt / screenshot
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
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{ocrNote}</p>
            ) : null}

            <button
              type="button"
              onClick={checkPaste}
              disabled={!canCheck || busy}
              className="btn-brand mt-4 min-h-12 w-full rounded-2xl px-5 text-base font-bold"
            >
              {busy ? "Checking…" : "Check email"}
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

          <section ref={resultRef} className="mt-5 min-w-0">
            {busy && !result ? (
              <div
                className="simple-card space-y-3 p-4 sm:p-5"
                aria-busy="true"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-[var(--brand-dim)]">
                  Checking sender · links · attachments · intent…
                </p>
                <div className="h-20 animate-pulse rounded-2xl bg-[var(--input)]" />
                <div className="h-14 animate-pulse rounded-2xl bg-[var(--input)]" />
              </div>
            ) : null}

            {!busy && !result ? (
              <p className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-4 py-8 text-center text-sm leading-relaxed text-[var(--ink-muted)]">
                Tap a demo or paste an email, then check.
              </p>
            ) : null}

            {result ? (
              <div className="space-y-4">
                {hasHardStop ? (
                  <div className="hard-stop-card" role="alert">
                    <p className="hard-stop-kicker">HARD STOP</p>
                    <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                      Do not act on this email
                    </p>
                    {result.becTheme ? (
                      <p className="mt-1 text-sm font-semibold opacity-90">
                        Attack theme: {result.becTheme}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-sm leading-relaxed opacity-90">
                      Irreversible asks detected. Verify out-of-band before
                      anything else.
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
                          className="flex gap-2.5 rounded-xl bg-black/5 px-3 py-2.5 text-sm font-semibold leading-snug sm:text-base"
                        >
                          <span
                            className="mt-0.5 shrink-0 rounded bg-[var(--danger-ink)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                            aria-hidden
                          >
                            STOP
                          </span>
                          <span className="min-w-0 break-words">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

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
                        {verdictUi?.stamp} · {result.riskScore}/100 ·{" "}
                        {result.confidence}
                      </p>
                      <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                        {verdictUi?.label}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">
                        {result.plainSummary}
                      </p>
                      {result.dangerousIntents.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {result.dangerousIntents.map((i) => (
                            <span
                              key={i}
                              className="rounded-full border border-[var(--danger-line)] bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold"
                            >
                              {i.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="simple-card p-4 sm:p-5">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    Why (multi-factor)
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink)]">
                    {result.reasons.slice(0, 5).map((r) => (
                      <li key={r} className="break-words">
                        {r}
                      </li>
                    ))}
                  </ul>
                  <ul className="mt-4 space-y-2">
                    {factorBars.map((f) => (
                      <li key={f.name}>
                        <div className="flex justify-between text-[11px] text-[var(--ink-muted)]">
                          <span>
                            {f.name}
                            {f.w ? ` · ${f.w}%` : ""}
                          </span>
                          <span>{f.score}/100</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--input)]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${f.score}%`,
                              background: barColor(f.score),
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {result.learnHow?.length ? (
                  <div className="simple-card p-4 sm:p-5">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      How this scam works (learn once)
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink)]">
                      {result.learnHow.map((t) => (
                        <li key={t} className="break-words">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="simple-card p-4 sm:p-5">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    What to do next
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ink)]">
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
        </main>
      </div>
    </div>
  );
}
