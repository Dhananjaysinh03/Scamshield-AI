"use client";

import Link from "next/link";
import { useState } from "react";
import { EMAIL_DEMOS, FEATURED_DEMO_ID } from "@/lib/email/demos";
import type { EmailAnalysisResult } from "@/lib/email/types";

/** Hits the real analyze API so the landing is not just copy */
export function LandingLiveCheck() {
  const featured =
    EMAIL_DEMOS.find((d) => d.id === FEATURED_DEMO_ID) || EMAIL_DEMOS[0];
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError("Check failed — open the full product and try again.");
    } finally {
      setBusy(false);
    }
  }

  const sender = result?.technicalFindings.sender;
  const urls = result?.technicalFindings.urls.items ?? [];
  const headers = result?.technicalFindings.headers;

  return (
    <section className="lp-live" aria-label="Live product check">
      <div className="lp-live-head">
        <p className="lp-kicker">Real API · not a mock</p>
        <h2 className="font-display">See a live check on this page</h2>
        <p className="lp-section-lead">
          One tap runs the same engine as the product: parse → score → STOP +
          evidence.
        </p>
      </div>

      <div className="lp-live-card">
        <div className="lp-live-actions">
          <button
            type="button"
            className="lp-btn-primary"
            disabled={busy}
            onClick={() => void run()}
          >
            {busy ? "Analyzing…" : "Run fake-bank OTP check"}
          </button>
          <Link href="/check" className="lp-btn-ghost">
            Open full checker
          </Link>
        </div>

        {error ? <p className="lp-live-error">{error}</p> : null}

        {!result && !busy && !error ? (
          <p className="lp-live-hint">
            Sample: fake HDFC OTP from{" "}
            <code>alerts@hdfc-secure-login.xyz</code> with SPF/DKIM fail
            headers.
          </p>
        ) : null}

        {busy && !result ? (
          <div className="lp-live-skeleton" aria-busy="true">
            <div />
            <div />
            <div />
          </div>
        ) : null}

        {result ? (
          <div className="lp-live-result">
            <div className="lp-live-verdict">
              <strong>
                {result.preventionLevel === "hard_stop"
                  ? "HARD STOP"
                  : result.verdict.toUpperCase()}
              </strong>
              <span>
                Score {result.riskScore}/100 · {result.confidence} confidence
              </span>
            </div>

            <dl className="lp-live-facts">
              <div>
                <dt>From</dt>
                <dd>{sender?.email || "—"}</dd>
              </div>
              <div>
                <dt>Domain</dt>
                <dd>{sender?.domain || "—"}</dd>
              </div>
              <div>
                <dt>Links found</dt>
                <dd>{urls.length}</dd>
              </div>
              <div>
                <dt>SPF / DKIM / DMARC</dt>
                <dd>
                  {headers?.provided
                    ? `${headers.spf || "—"} / ${headers.dkim || "—"} / ${headers.dmarc || "—"}`
                    : "not in paste"}
                </dd>
              </div>
            </dl>

            {urls[0] ? (
              <p className="lp-live-url">
                <span>Link evidence</span>
                <code>{urls[0].url}</code>
                {urls[0].findings[0] ? (
                  <em>{urls[0].findings[0]}</em>
                ) : null}
              </p>
            ) : null}

            {result.scamType.length > 0 ? (
              <div className="lp-live-tags">
                {result.scamType.slice(0, 5).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            ) : null}

            <Link href="/check" className="lp-live-more">
              See full evidence pack on /check →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
