"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import {
  DEMO_SCENARIOS,
  scenarioToEvidence,
  type DemoScenarioId,
} from "@/lib/mocks/scenarios";
import type {
  EvidenceItem,
  OcrResponse,
  ScanResult,
  Verdict,
} from "@/lib/types";
import type { AnalyzeResult } from "@/lib/analyze";

const VERDICT_STYLE: Record<
  Verdict,
  { label: string; className: string; icon: string }
> = {
  scam: {
    label: "This looks like a scam",
    className:
      "border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)]",
    icon: "!",
  },
  likely_scam: {
    label: "Very likely a scam",
    className:
      "border-[var(--warn-line)] bg-[var(--warn-bg)] text-[var(--warn-ink)]",
    icon: "!",
  },
  suspicious: {
    label: "Looks suspicious",
    className:
      "border-[var(--caution-line)] bg-[var(--caution-bg)] text-[var(--caution-ink)]",
    icon: "?",
  },
  clean: {
    label: "No strong scam patterns",
    className:
      "border-[var(--ok-line)] bg-[var(--ok-bg)] text-[var(--ok-ink)]",
    icon: "✓",
  },
};

function newId() {
  return crypto.randomUUID();
}

export function SimpleCheck() {
  const [text, setText] = useState("");
  const [scenario, setScenario] = useState<DemoScenarioId>("upi_kyc");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);
  const [dark, setDark] = useState(false);
  const [ocrNote, setOcrNote] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  const canCheck = text.trim().length > 0;

  const whyBullets = useMemo(() => {
    if (!scan) return [];
    return scan.signals.slice(0, 3).map((s) =>
      s.replace(/^[^:]+:\s*/, "").replace(/^"/, "").replace(/"$/, ""),
    );
  }, [scan]);

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

  async function runAnalyze(evidence: EvidenceItem[]) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence }),
      });
      if (!res.ok) throw new Error("Check failed");
      const data = (await res.json()) as AnalyzeResult;
      setScan(data.scan);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  function checkPaste() {
    const content = text.trim();
    if (!content) return;
    const evidence: EvidenceItem[] = [
      {
        id: newId(),
        type: "text",
        content,
        createdAt: new Date().toISOString(),
      },
    ];
    void runAnalyze(evidence);
  }

  /** One-tap: select scenario, fill text, run check */
  function checkExample(id: DemoScenarioId = scenario) {
    setScenario(id);
    const drops = scenarioToEvidence(id);
    setText(drops.map((d) => d.content).join("\n\n"));
    void runAnalyze(drops);
  }

  function previewExample(id: DemoScenarioId) {
    setScenario(id);
    const drops = scenarioToEvidence(id);
    setText(drops.map((d) => d.content).join("\n\n"));
    setScan(null);
    setError(null);
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setOcrNote(null);

    if (
      file.type.startsWith("text/") ||
      /\.(txt|md|csv)$/i.test(file.name)
    ) {
      const content = await file.text();
      setText((prev) => (prev ? `${prev}\n\n${content}` : content));
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
          setText((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
          setOcrNote("Screenshot text extracted — tap Check if it's a scam.");
        } else {
          setOcrNote(
            data.message ||
              "Couldn’t read this screenshot. Paste the message text instead.",
          );
          setText(
            (prev) =>
              prev ||
              `[screenshot] ${file.name} — paste visible text for a full check.`,
          );
        }
      } catch {
        setOcrNote("Upload failed. Paste the message text instead.");
      } finally {
        setBusy(false);
      }
      return;
    }

    setText(
      (prev) =>
        `${prev ? prev + "\n\n" : ""}[file] ${file.name} (${file.type || "unknown"})`,
    );
  }

  const verdictUi = scan ? VERDICT_STYLE[scan.verdict] : null;

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
          <h1 className="max-w-3xl text-[1.85rem] font-extrabold leading-[1.15] tracking-tight text-[var(--ink)] sm:text-5xl">
            Got a suspicious message?
          </h1>
          <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            Paste it here. We&apos;ll tell you if it looks like a scam — in
            simple words.
          </p>

          {/* Examples — one-tap */}
          <section className="simple-card mt-7 p-4 sm:mt-8 sm:p-6">
            <p className="text-sm font-semibold text-[var(--ink)] sm:text-base">
              Not sure what to paste? Try an example
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
              Tap a card to load it, or tap{" "}
              <span className="font-medium text-[var(--ink)]">
                Check this example
              </span>{" "}
              to run a full check in one go.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              {DEMO_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => previewExample(s.id)}
                  onDoubleClick={() => checkExample(s.id)}
                  disabled={busy}
                  className={`min-h-14 rounded-2xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-50 ${
                    scenario === s.id
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm"
                      : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--brand)]/45"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug text-[var(--ink)]">
                    {s.label}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-snug text-[var(--ink-muted)]">
                    {s.consumerLine}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => checkExample()}
              disabled={busy}
              className="btn-brand mt-4 min-h-12 w-full rounded-2xl px-5 text-base font-semibold sm:w-auto"
            >
              {busy ? "Checking…" : "Check this example"}
            </button>
          </section>

          <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-2">
            {/* Step 1 */}
            <section className="simple-card p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="step-num" aria-hidden>
                  1
                </span>
                <div>
                  <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                    Paste the suspicious message
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                    SMS, WhatsApp, email — copy and paste what you received.
                  </p>
                </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="Example: URGENT — Your account will be blocked. Click this link to verify…"
                className="mt-4 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--input)] px-3.5 py-3.5 text-base leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              />
              <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 text-sm text-[var(--ink-muted)] transition hover:border-[var(--brand)]/50 hover:text-[var(--ink)]">
                Or upload a screenshot / text file
                <input
                  type="file"
                  accept="image/*,.txt,.md,.csv,.pdf,.apk,.exe"
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
                {busy ? "Checking…" : "Check if it's a scam"}
              </button>
              {error ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : null}
            </section>

            <div className="flex flex-col gap-5 sm:gap-6">
              {/* Step 2 */}
              <section ref={resultRef} className="simple-card p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="step-num" aria-hidden>
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-snug text-[var(--ink)]">
                      See the result
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                      How risky it looks — and why — in plain language.
                    </p>
                  </div>
                </div>

                {!scan ? (
                  <p className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
                    Your result will appear here after you check a message.
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
                            Verdict · score {scan.score}/100
                          </p>
                          <p className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">
                            {verdictUi?.label}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed sm:text-[0.95rem]">
                            {scan.plainSummary}
                          </p>
                          {scan.malware.detected ? (
                            <p className="mt-3 rounded-xl bg-black/5 px-3 py-2 text-sm font-semibold dark:bg-white/10">
                              Malware / remote-access lure — do not download or
                              install anything.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {whyBullets.length > 0 ? (
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          Why we flagged this
                        </p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--ink)]">
                          {whyBullets.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
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
                      What you can do next
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                      Simple steps to stay safe.
                    </p>
                  </div>
                </div>
                {scan ? (
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
                    {scan.advice.map((a) => (
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
                    Advice appears after a check.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowTech((v) => !v)}
                  aria-expanded={showTech}
                  className="mt-5 min-h-11 text-sm font-semibold text-[var(--brand-dim)] underline-offset-4 hover:underline"
                >
                  {showTech
                    ? "Hide technical details"
                    : "Show technical details"}
                </button>
              </section>
            </div>
          </div>

          {/* Technical vault — animated */}
          <div
            className={`tech-vault-wrap mt-8 sm:mt-10 ${showTech ? "is-open" : ""}`}
          >
            <div className="tech-vault-inner">
              <section className="tech-vault overflow-hidden rounded-2xl border border-zinc-800">
                <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  Technical vault · Pitch mode · honeypot · Exa · timeline
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
