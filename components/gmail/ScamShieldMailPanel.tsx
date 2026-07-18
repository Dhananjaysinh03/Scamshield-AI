"use client";

import type { InboxMail } from "@/lib/email/inboxMail";
import type { EmailAnalysisResult } from "@/lib/email/types";

type Props = {
  mail: InboxMail;
  analysis: EmailAnalysisResult | null;
  analyzing: boolean;
  trustStatus: "trusted" | "blocked" | "unknown";
  onClose: () => void;
  onTrust: () => void;
  onBlock: () => void;
  onRecheck: () => void;
};

export function ScamShieldMailPanel({
  mail,
  analysis,
  analyzing,
  trustStatus,
  onClose,
  onTrust,
  onBlock,
  onRecheck,
}: Props) {
  const verdict = analysis?.verdict;
  const hardStop = analysis?.preventionLevel === "hard_stop";

  const headline =
    analyzing
      ? "Analyzing security…"
      : hardStop
        ? "Danger — stop first"
        : verdict === "phishing"
          ? "Phishing signals found"
          : verdict === "suspicious"
            ? "Something looks off"
            : verdict === "safe"
              ? "Looks safer"
              : "Find threats";

  const prompts = [
    {
      label: "Is this sender trustworthy?",
      run: onRecheck,
    },
    {
      label: "Check for phishing links",
      run: onRecheck,
    },
    {
      label:
        trustStatus === "blocked"
          ? "Sender already blocked"
          : "Report as scam / block sender",
      run: onBlock,
    },
  ];

  return (
    <aside className="gm-ss-panel" aria-label="ScamShield in Mail">
      <header className="gm-ss-head">
        <div className="gm-ss-brand">
          <span className="gm-ss-mark">S</span>
          <strong>ScamShield</strong>
        </div>
        <button type="button" className="gm-icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>

      <div className="gm-ss-scroll">
        <h2
          className={`gm-ss-title ${
            hardStop || verdict === "phishing"
              ? "gm-ss-title--danger"
              : verdict === "safe"
                ? "gm-ss-title--ok"
                : "gm-ss-title--warn"
          }`}
        >
          {headline}
        </h2>

        <p className="gm-ss-sub">
          Checking <strong>{mail.fromName}</strong> &lt;{mail.fromEmail}&gt;
        </p>

        {analyzing ? (
          <div className="gm-ss-loading">
            <div />
            <div />
            <div />
          </div>
        ) : null}

        {analysis && !analyzing ? (
          <div className="gm-ss-result">
            <div className="gm-ss-score">
              <span>Risk score</span>
              <strong>{analysis.riskScore}/100</strong>
            </div>
            <p className="gm-ss-summary">
              {analysis.plainSummary
                .replace(/^PHISHING[^.]*\.\s*/i, "")
                .replace(/^Suspicious\s*—\s*/i, "")
                .slice(0, 180)}
            </p>

            {hardStop ? (
              <ul className="gm-ss-stops">
                {(analysis.hardStops.length
                  ? analysis.hardStops
                  : ["Do not share OTP, pay, open files, or share screen."]
                )
                  .slice(0, 3)
                  .map((s) => (
                    <li key={s}>{s.replace(/^DO NOT\s+/i, "")}</li>
                  ))}
              </ul>
            ) : null}

            {analysis.scamType.length > 0 ? (
              <div className="gm-ss-tags">
                {analysis.scamType.slice(0, 4).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            ) : null}

            {analysis.technicalFindings.urls.items[0] ? (
              <div className="gm-ss-link">
                <span>Link evidence</span>
                <code>{analysis.technicalFindings.urls.items[0].url}</code>
              </div>
            ) : null}

            {analysis.meta ? (
              <p className="gm-ss-meta">
                Engine v{analysis.meta.engineVersion} ·{" "}
                {analysis.meta.signalCount} signals · {analysis.meta.durationMs}
                ms
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="gm-ss-prompts">
          {prompts.map((p) => (
            <button key={p.label} type="button" onClick={p.run}>
              <span aria-hidden>↻</span>
              {p.label}
            </button>
          ))}
        </div>

        {trustStatus === "unknown" ? (
          <div className="gm-ss-trust-card">
            <p>Do you trust this sender?</p>
            <div>
              <button type="button" className="gm-btn-trust" onClick={onTrust}>
                Yes, trust
              </button>
              <button type="button" className="gm-btn-block" onClick={onBlock}>
                No, block
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="gm-ss-foot">
        <input
          type="text"
          placeholder="Ask ScamShield about this email…"
          aria-label="Ask ScamShield"
          onKeyDown={(e) => {
            if (e.key === "Enter") onRecheck();
          }}
        />
      </footer>
    </aside>
  );
}
