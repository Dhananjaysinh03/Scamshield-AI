"use client";

import { useMemo, useState } from "react";
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
  { label: string; className: string }
> = {
  scam: {
    label: "This looks like a scam",
    className: "bg-red-50 text-red-800 border-red-200",
  },
  likely_scam: {
    label: "Very likely a scam",
    className: "bg-orange-50 text-orange-900 border-orange-200",
  },
  suspicious: {
    label: "Looks suspicious",
    className: "bg-amber-50 text-amber-900 border-amber-200",
  },
  clean: {
    label: "No strong scam patterns",
    className: "bg-emerald-50 text-emerald-900 border-emerald-200",
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

  const canCheck = text.trim().length > 0;

  const whyBullets = useMemo(() => {
    if (!scan) return [];
    return scan.signals.slice(0, 3).map((s) =>
      s.replace(/^[^:]+:\s*/, "").replace(/^"/, "").replace(/"$/, ""),
    );
  }, [scan]);

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

  function checkExample() {
    const drops = scenarioToEvidence(scenario);
    setText(drops.map((d) => d.content).join("\n\n"));
    void runAnalyze(drops);
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
          // Still flag malware by filename
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

    // Other files — include name for malware extension detection
    setText(
      (prev) =>
        `${prev ? prev + "\n\n" : ""}[file] ${file.name} (${file.type || "unknown"})`,
    );
  }

  const verdictUi = scan ? VERDICT_STYLE[scan.verdict] : null;

  return (
    <div className={dark ? "theme-soc" : "theme-consumer"}>
      <div className="simple-shell min-h-screen">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
              S
            </span>
            <span className="text-lg font-bold tracking-tight text-[var(--ink)]">
              ScamShield
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="min-h-11 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-sm text-[var(--ink-muted)]"
          >
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-[var(--ink)] sm:text-5xl">
            Got a suspicious message?
          </h1>
          <p className="mt-3 max-w-xl text-base text-[var(--ink-muted)] sm:text-lg">
            Paste it here. We&apos;ll tell you if it looks like a scam — in
            simple words. Built for everyday people. No tech skills needed.
          </p>

          {/* Examples */}
          <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-6">
            <p className="text-sm font-medium text-[var(--ink)]">
              Not sure what to paste? Try an example. Pick one, then tap
              &quot;Check this example&quot;.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DEMO_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s.id)}
                  className={`min-h-11 rounded-xl border px-3 py-3 text-left transition ${
                    scenario === s.id
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--brand)]/50"
                  }`}
                >
                  <span className="block text-sm font-semibold text-[var(--ink)]">
                    {s.label}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                    {s.consumerLine}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={checkExample}
              disabled={busy}
              className="mt-4 min-h-11 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {busy ? "Checking…" : "Check this example"}
            </button>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Step 1 */}
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-[var(--ink)]">
                  Paste the suspicious message
                </h2>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                SMS, WhatsApp, email — copy and paste the text you received.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="Example: 'URGENT — Your account will be blocked. Click this link to verify...'"
                className="mt-4 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--input)] px-3 py-3 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--brand)]/40"
              />
              <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--input)] px-4 text-sm text-[var(--ink-muted)]">
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
                <p className="mt-2 text-xs text-[var(--ink-muted)]">{ocrNote}</p>
              ) : null}
              <button
                type="button"
                onClick={checkPaste}
                disabled={!canCheck || busy}
                className="mt-4 min-h-12 w-full rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Checking…" : "Check if it's a scam"}
              </button>
              {error ? (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              ) : null}
            </section>

            <div className="flex flex-col gap-6">
              {/* Step 2 */}
              <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                    2
                  </span>
                  <h2 className="text-lg font-bold text-[var(--ink)]">
                    See the result
                  </h2>
                </div>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  We&apos;ll say how risky it looks and why — in plain language.
                </p>

                {!scan ? (
                  <p className="mt-6 text-sm text-[var(--ink-muted)]">
                    Your result will appear here after you check a message.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div
                      className={`rounded-xl border px-4 py-4 ${verdictUi?.className}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                        Verdict · score {scan.score}/100
                      </p>
                      <p className="mt-1 text-xl font-extrabold">
                        {verdictUi?.label}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">
                        {scan.plainSummary}
                      </p>
                      {scan.malware.detected ? (
                        <p className="mt-3 text-sm font-semibold">
                          Malware / remote-access lure detected — do not
                          download anything.
                        </p>
                      ) : null}
                    </div>
                    {whyBullets.length > 0 ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--ink)]">
                        {whyBullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </section>

              {/* Step 3 */}
              <section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                    3
                  </span>
                  <h2 className="text-lg font-bold text-[var(--ink)]">
                    What you can do next
                  </h2>
                </div>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Save a report, or use extra protection if there&apos;s a fake
                  website.
                </p>
                {scan ? (
                  <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]">
                    {scan.advice.map((a) => (
                      <li key={a} className="flex gap-2">
                        <span className="text-[var(--brand)]">✓</span>
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
                  className="mt-5 text-sm font-semibold text-[var(--brand-dim)] underline-offset-2 hover:underline"
                >
                  {showTech
                    ? "Hide technical details"
                    : "Show technical details"}
                </button>
              </section>
            </div>
          </div>

          {showTech ? (
            <section className="tech-vault mt-10 overflow-hidden rounded-2xl border border-zinc-800">
              <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                Technical vault · Systems A / B / C · judges & power users
              </div>
              <div className="bg-zinc-950 px-3 py-6 sm:px-6">
                <Dashboard />
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
