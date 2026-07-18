"use client";

import type { InboxMail } from "@/lib/email/inboxMail";
import type { EmailAnalysisResult } from "@/lib/email/types";

type Props = {
  mail: InboxMail;
  analysis: EmailAnalysisResult | null;
  analyzing: boolean;
  onTrust: () => void;
  onBlock: () => void;
  onDismiss: () => void;
};

/**
 * Outlook-style “Do you trust this sender?” popup when opening mail.
 * If user dismisses without choosing, banner + side panel still offer the choice.
 */
export function TrustSenderModal({
  mail,
  analysis,
  analyzing,
  onTrust,
  onBlock,
  onDismiss,
}: Props) {
  const risk =
    analysis?.preventionLevel === "hard_stop" || analysis?.verdict === "phishing"
      ? "high"
      : analysis?.verdict === "suspicious" || mail.category === "spam"
        ? "medium"
        : analyzing
          ? "checking"
          : "low";

  return (
    <div className="gm-modal-backdrop" role="presentation" onClick={onDismiss}>
      <div
        className={`gm-modal gm-modal--${risk}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-trust-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gm-modal-top">
          <span className="gm-ss-mark">S</span>
          <span>ScamShield</span>
          <button type="button" className="gm-icon-btn" onClick={onDismiss}>
            ✕
          </button>
        </div>

        <h2 id="gm-trust-title">Do you trust this sender?</h2>
        <p className="gm-modal-from">
          <strong>{mail.fromName}</strong>
          <br />
          <code>{mail.fromEmail}</code>
        </p>

        {risk === "high" ? (
          <p className="gm-modal-alert">
            ScamShield found strong phishing signals
            {analysis ? ` (score ${analysis.riskScore}/100)` : ""}. Trusting
            this sender is risky — we recommend blocking.
          </p>
        ) : risk === "medium" ? (
          <p className="gm-modal-alert gm-modal-alert--mid">
            This message looks suspicious or spammy. Only trust if you know
            them.
          </p>
        ) : risk === "checking" ? (
          <p className="gm-modal-alert gm-modal-alert--check">
            Analyzing this email now…
          </p>
        ) : (
          <p className="gm-modal-alert gm-modal-alert--ok">
            No strong trap found so far — still confirm you know this person or
            brand.
          </p>
        )}

        <div className="gm-modal-actions">
          {risk === "high" || risk === "medium" ? (
            <>
              <button type="button" className="gm-btn-block" onClick={onBlock}>
                No, block sender
              </button>
              <button
                type="button"
                className="gm-btn-trust gm-btn-trust--ghost"
                onClick={onTrust}
              >
                Trust anyway
              </button>
            </>
          ) : (
            <>
              <button type="button" className="gm-btn-trust" onClick={onTrust}>
                Yes, I trust them
              </button>
              <button type="button" className="gm-btn-block" onClick={onBlock}>
                No, block sender
              </button>
            </>
          )}
        </div>

        <button type="button" className="gm-modal-later" onClick={onDismiss}>
          Decide later — keep reading with ScamShield open
        </button>

        {risk === "high" ? (
          <p className="gm-modal-hint">
            If you dismiss this popup, ScamShield stays open in the side panel
            (like Gemini in Gmail) with STOP guidance.
          </p>
        ) : (
          <p className="gm-modal-hint">
            Like Outlook’s “Do you trust this sender?” — your choice is
            remembered on this device.
          </p>
        )}
      </div>
    </div>
  );
}
