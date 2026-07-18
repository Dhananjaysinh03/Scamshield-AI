"use client";

import { useEffect, useMemo, useState } from "react";
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

type CheckStatus = "pending" | "checking" | "clear" | "flagged" | "warn";

type CheckItem = {
  id: string;
  label: string;
  detail: string;
  status: CheckStatus;
};

type SecurityLevel = {
  key: "critical" | "high" | "medium" | "low" | "secure" | "scanning";
  label: string;
  blurb: string;
  pct: number;
};

function securityLevel(
  analysis: EmailAnalysisResult | null,
  analyzing: boolean,
): SecurityLevel {
  if (analyzing || !analysis) {
    return {
      key: "scanning",
      label: "Scanning",
      blurb: "Running multi-factor security checks…",
      pct: 35,
    };
  }
  if (analysis.preventionLevel === "hard_stop" || analysis.riskScore >= 80) {
    return {
      key: "critical",
      label: "Critical",
      blurb: "Hard STOP — do not OTP, pay, open files, or share screen.",
      pct: 92,
    };
  }
  if (analysis.verdict === "phishing" || analysis.riskScore >= 60) {
    return {
      key: "high",
      label: "High risk",
      blurb: "Strong phishing signals — treat as untrusted.",
      pct: 78,
    };
  }
  if (analysis.verdict === "suspicious" || analysis.riskScore >= 35) {
    return {
      key: "medium",
      label: "Medium",
      blurb: "Something looks off — verify before you act.",
      pct: 55,
    };
  }
  if (analysis.riskScore >= 18) {
    return {
      key: "low",
      label: "Low risk",
      blurb: "Minor notes only — stay careful with unexpected links.",
      pct: 28,
    };
  }
  return {
    key: "secure",
    label: "Secure",
    blurb: "No strong trap found across checked factors.",
    pct: 12,
  };
}

function buildChecklist(
  analysis: EmailAnalysisResult | null,
  analyzing: boolean,
  step: number,
): CheckItem[] {
  const t = analysis?.technicalFindings;
  const defs: Omit<CheckItem, "status">[] = [
    {
      id: "sender",
      label: "Sender identity",
      detail: t
        ? `${t.sender.email || "unknown"} · score ${t.sender.score}`
        : "From name, domain, Reply-To",
    },
    {
      id: "reputation",
      label: "Sender reputation",
      detail: analysis?.senderReputation?.plainMessage
        ? analysis.senderReputation.plainMessage.slice(0, 70)
        : "Repeat scam / known-bad From IDs",
    },
    {
      id: "content",
      label: "Message pressure",
      detail: t
        ? t.content.socialEngineering.slice(0, 2).join(" · ") ||
          `Content score ${t.content.score}`
        : "OTP, pay, urgency, remote access",
    },
    {
      id: "links",
      label: "Link safety",
      detail: t
        ? t.urls.items.length
          ? `${t.urls.items.length} link(s) · score ${t.urls.score}`
          : "No links in message"
        : "Fake login / suspicious domains",
    },
    {
      id: "files",
      label: "Attachments / files",
      detail: t
        ? t.attachments.items.length
          ? t.attachments.items.map((a) => a.name).join(", ")
          : "No file names detected"
        : "Dangerous names like .pdf.exe",
    },
    {
      id: "headers",
      label: "Auth headers",
      detail: t?.headers.provided
        ? `SPF ${t.headers.spf || "—"} · DKIM ${t.headers.dkim || "—"} · DMARC ${t.headers.dmarc || "—"}`
        : "SPF / DKIM / DMARC when present",
    },
    {
      id: "stop",
      label: "Irreversible-action brake",
      detail: analysis
        ? analysis.preventionLevel === "hard_stop"
          ? "STOP armed — dangerous ask detected"
          : "No hard-stop action required"
        : "OTP / pay / open file / screen share",
    },
  ];

  const scoreOf = (id: string): number => {
    if (!t) return 0;
    if (id === "sender") return t.sender.score;
    if (id === "reputation") {
      const lvl = analysis?.senderReputation?.level;
      if (lvl === "known_bad" || lvl === "frequent") return 80;
      if (lvl === "seen") return 45;
      return 0;
    }
    if (id === "content") return t.content.score;
    if (id === "links") return t.urls.score;
    if (id === "files") return t.attachments.score;
    if (id === "headers") return t.headers.provided ? t.headers.score : 0;
    if (id === "stop")
      return analysis?.preventionLevel === "hard_stop" ? 100 : 0;
    return 0;
  };

  return defs.map((d, i) => {
    if (analyzing) {
      if (i < step) return { ...d, status: "checking" as const };
      if (i === step) return { ...d, status: "checking" as const };
      return { ...d, status: "pending" as const };
    }
    if (!analysis) return { ...d, status: "pending" as const };
    const s = scoreOf(d.id);
    if (s >= 55) return { ...d, status: "flagged" as const };
    if (s >= 30) return { ...d, status: "warn" as const };
    return { ...d, status: "clear" as const };
  });
}

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
  const [scanStep, setScanStep] = useState(0);
  const [ask, setAsk] = useState("");

  useEffect(() => {
    if (!analyzing) {
      setScanStep(0);
      return;
    }
    setScanStep(0);
    const id = window.setInterval(() => {
      setScanStep((s) => Math.min(s + 1, 6));
    }, 220);
    return () => window.clearInterval(id);
  }, [analyzing, mail.id]);

  const level = useMemo(
    () => securityLevel(analysis, analyzing),
    [analysis, analyzing],
  );

  const checklist = useMemo(
    () => buildChecklist(analysis, analyzing, scanStep),
    [analysis, analyzing, scanStep],
  );

  const flaggedCount = checklist.filter((c) => c.status === "flagged").length;
  const clearCount = checklist.filter((c) => c.status === "clear").length;

  const prompts = [
    { label: "Explain this security level", run: onRecheck },
    { label: "Show why links look risky", run: onRecheck },
    {
      label:
        trustStatus === "blocked"
          ? "Sender already blocked"
          : "Report as scam / block sender",
      run: onBlock,
    },
  ];

  function onAskSubmit() {
    const q = ask.trim().toLowerCase();
    setAsk("");
    if (!q) {
      onRecheck();
      return;
    }
    if (q.includes("block") || q.includes("scam") || q.includes("report")) {
      onBlock();
      return;
    }
    if (q.includes("trust")) {
      onTrust();
      return;
    }
    onRecheck();
  }

  return (
    <aside className="gm-ss-panel" aria-label="ScamShield in Mail">
      <header className="gm-ss-head">
        <button type="button" className="gm-icon-btn" aria-label="Menu">
          ☰
        </button>
        <strong className="gm-ss-name">ScamShield</strong>
        <button
          type="button"
          className="gm-icon-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      <div className="gm-ss-scroll">
        <h2 className={`gm-ss-hero gm-ss-hero--${level.key}`}>{level.label}</h2>
        <p className="gm-ss-hero-sub">{level.blurb}</p>

        <div className={`gm-sec-meter gm-sec-meter--${level.key}`}>
          <div className="gm-sec-meter-top">
            <span>Security level</span>
            <strong>
              {analyzing ? "…" : analysis ? `${analysis.riskScore}/100 risk` : "—"}
            </strong>
          </div>
          <div className="gm-sec-track" aria-hidden>
            <div
              className="gm-sec-fill"
              style={{ width: `${level.pct}%` }}
            />
          </div>
          <div className="gm-sec-scale">
            <span>Secure</span>
            <span>Medium</span>
            <span>Critical</span>
          </div>
        </div>

        <p className="gm-ss-checking">
          Checking <strong>{mail.fromName}</strong>
          <br />
          <code>{mail.fromEmail}</code>
        </p>

        <section className="gm-check-block" aria-label="Threat checklist">
          <div className="gm-check-head">
            <h3>Threat checklist</h3>
            {!analyzing && analysis ? (
              <span>
                {flaggedCount} flagged · {clearCount} clear
              </span>
            ) : (
              <span>Scanning factors…</span>
            )}
          </div>
          <ul className="gm-check-list">
            {checklist.map((item) => (
              <li
                key={item.id}
                className={`gm-check-item gm-check-item--${item.status}`}
              >
                <span className="gm-check-mark" aria-hidden>
                  {item.status === "clear"
                    ? "✓"
                    : item.status === "flagged"
                      ? "!"
                      : item.status === "warn"
                        ? "?"
                        : item.status === "checking"
                          ? "●"
                          : "○"}
                </span>
                <div>
                  <p className="gm-check-label">{item.label}</p>
                  <p className="gm-check-detail">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {analysis && !analyzing && analysis.preventionLevel === "hard_stop" ? (
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

        {analysis && !analyzing && analysis.scamType.length > 0 ? (
          <div className="gm-ss-tags">
            {analysis.scamType.slice(0, 5).map((t) => (
              <span key={t}>{t}</span>
            ))}
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
                Yes, I trust them
              </button>
              <button type="button" className="gm-btn-block" onClick={onBlock}>
                No, block sender
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="gm-ss-foot">
        <div className="gm-ss-ask">
          <button type="button" className="gm-ss-ask-icon" aria-label="Add">
            +
          </button>
          <input
            type="text"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="Ask ScamShield"
            aria-label="Ask ScamShield"
            onKeyDown={(e) => {
              if (e.key === "Enter") onAskSubmit();
            }}
          />
          <button
            type="button"
            className="gm-ss-send"
            onClick={onAskSubmit}
            aria-label="Send"
          >
            ↑
          </button>
        </div>
        <p className="gm-ss-disclaimer">
          ScamShield can make mistakes. Always verify before you act.
        </p>
      </footer>
    </aside>
  );
}
