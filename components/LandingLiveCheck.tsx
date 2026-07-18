"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EMAIL_DEMOS, FEATURED_DEMO_ID } from "@/lib/email/demos";
import type { EmailAnalysisResult } from "@/lib/email/types";

/** Hits the real analyze API so the landing is not just copy */
export function LandingLiveCheck() {
  const featured =
    EMAIL_DEMOS.find((d) => d.id === FEATURED_DEMO_ID) || EMAIL_DEMOS[0];
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/email-analyze")
      .then((r) => {
        if (!cancelled) setEngineOnline(r.ok);
      })
      .catch(() => {
        if (!cancelled) setEngineOnline(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/email-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: featured.raw }),
      });
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as EmailAnalysisResult;
      setResult(data);
      setEngineOnline(true);
    } catch {
      setError("Check failed — open /check and try again.");
      setEngineOnline(false);
    } finally {
      setBusy(false);
    }
  }

  const hard =
    result?.preventionLevel === "hard_stop" || result?.verdict === "phishing";

  return (
    <section className="lp-live" aria-label="Live product check">
      <div className="lp-live-card lp-live-card--big">
        <div className="lp-live-row">
          <div>
            <p className="lp-kicker">
              Real engine
              {engineOnline === true ? (
                <span className="lp-engine-pill lp-engine-pill--ok"> Live</span>
              ) : engineOnline === false ? (
                <span className="lp-engine-pill lp-engine-pill--bad"> Down</span>
              ) : null}
            </p>
            <h2 className="font-display">One-tap phishing check</h2>
            <p className="lp-live-brief">
              Fake HDFC OTP → same API as the product.
            </p>
          </div>
          <button
            type="button"
            className="lp-btn-primary lp-btn-lg"
            disabled={busy}
            onClick={() => void run()}
          >
            {busy ? "Analyzing…" : "▶ Run check"}
          </button>
        </div>

        {error ? <p className="lp-live-error">{error}</p> : null}

        {result ? (
          <div className={`lp-live-result ${hard ? "lp-live-result--bad" : ""}`}>
            <div className="lp-live-verdict">
              <strong>
                {hard ? "HARD STOP" : result.verdict.toUpperCase()}
              </strong>
              <span>
                {result.riskScore}/100 · {result.meta?.signalCount ?? "—"}{" "}
                signals
              </span>
            </div>
            <div className="lp-live-chips">
              {(result.scamType.slice(0, 4).length
                ? result.scamType.slice(0, 4)
                : ["Checked"]
              ).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <Link href="/inbox" className="lp-live-more">
              See this inside Gmail demo →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
