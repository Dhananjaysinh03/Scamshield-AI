"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  INBOX_MAILS,
  type InboxCategory,
  type InboxMail,
} from "@/lib/email/inboxMail";
import type { EmailAnalysisResult } from "@/lib/email/types";
import { ScamShieldMailPanel } from "@/components/gmail/ScamShieldMailPanel";
import { TrustSenderModal } from "@/components/gmail/TrustSenderModal";

type TrustMap = Record<string, "trusted" | "blocked" | "unknown">;

const TRUST_KEY = "scamshield-inbox-trust-v1";

function loadTrust(): TrustMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TRUST_KEY) || "{}") as TrustMap;
  } catch {
    return {};
  }
}

function saveTrust(map: TrustMap) {
  localStorage.setItem(TRUST_KEY, JSON.stringify(map));
}

function categoryBadge(cat: InboxCategory) {
  if (cat === "phishing") return { label: "Phishing risk", cls: "gm-badge--phish" };
  if (cat === "spam") return { label: "Spam", cls: "gm-badge--spam" };
  return { label: "Likely genuine", cls: "gm-badge--ok" };
}

export function GmailInbox() {
  const [mails, setMails] = useState(INBOX_MAILS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [nav, setNav] = useState<"inbox" | "starred" | "spam">("inbox");
  const [trust, setTrust] = useState<TrustMap>({});
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [analysis, setAnalysis] = useState<EmailAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [composeHint, setComposeHint] = useState(false);

  useEffect(() => {
    setTrust(loadTrust());
  }, []);

  const selected = useMemo(
    () => mails.find((m) => m.id === selectedId) || null,
    [mails, selectedId],
  );

  const visible = useMemo(() => {
    if (nav === "starred") return mails.filter((m) => m.starred);
    if (nav === "spam") return mails.filter((m) => m.category === "spam");
    return mails.filter((m) => m.category !== "spam");
  }, [mails, nav]);

  const unreadCount = mails.filter(
    (m) => m.unread && m.category !== "spam",
  ).length;

  const runAnalyze = useCallback(async (mail: InboxMail) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/email-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: mail.raw }),
      });
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as EmailAnalysisResult;
      setAnalysis(data);
    } catch {
      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  function openMail(mail: InboxMail) {
    setSelectedId(mail.id);
    setPanelOpen(true);
    setMails((prev) =>
      prev.map((m) => (m.id === mail.id ? { ...m, unread: false } : m)),
    );

    const status = trust[mail.fromEmail] || "unknown";
    void runAnalyze(mail);

    // Outlook / Gmail-style: ask trust for unknown senders (esp. risky)
    if (status === "unknown") {
      setShowTrustModal(true);
    } else {
      setShowTrustModal(false);
    }
  }

  function setSenderTrust(
    email: string,
    status: "trusted" | "blocked",
    mailId?: string,
  ) {
    const next = { ...trust, [email]: status };
    setTrust(next);
    saveTrust(next);
    setShowTrustModal(false);

    if (status === "blocked" && mailId) {
      setMails((prev) =>
        prev.map((m) =>
          m.id === mailId ? { ...m, category: "spam" as const } : m,
        ),
      );
    }
  }

  function toggleStar(id: string, e: MouseEvent) {
    e.stopPropagation();
    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)),
    );
  }

  const trustStatus = selected
    ? trust[selected.fromEmail] || "unknown"
    : "unknown";

  return (
    <div className="gm-app">
      {/* Top bar */}
      <header className="gm-top">
        <div className="gm-top-left">
          <button type="button" className="gm-icon-btn" aria-label="Menu">
            ☰
          </button>
          <Link href="/" className="gm-logo" title="ScamShield home">
            <span className="gm-logo-mark">G</span>
            <span className="gm-logo-text">
              Mail <em>+ ScamShield</em>
            </span>
          </Link>
        </div>
        <div className="gm-search">
          <span aria-hidden>⌕</span>
          <input
            type="search"
            placeholder="Search mail"
            aria-label="Search mail"
          />
        </div>
        <div className="gm-top-right">
          <Link href="/check" className="gm-top-link">
            Paste checker
          </Link>
          <Link href="/" className="gm-top-link">
            Home
          </Link>
          <div className="gm-avatar" title="Demo user">
            Y
          </div>
        </div>
      </header>

      <div className="gm-body">
        {/* Left nav */}
        <aside className="gm-nav">
          <button
            type="button"
            className="gm-compose"
            onClick={() => setComposeHint(true)}
          >
            ✎ Compose
          </button>
          {composeHint ? (
            <p className="gm-compose-hint">
              Demo inbox — open a mail to see ScamShield.
            </p>
          ) : null}
          <nav>
            <button
              type="button"
              className={nav === "inbox" ? "active" : ""}
              onClick={() => {
                setNav("inbox");
                setSelectedId(null);
              }}
            >
              Inbox {unreadCount ? <b>{unreadCount}</b> : null}
            </button>
            <button
              type="button"
              className={nav === "starred" ? "active" : ""}
              onClick={() => {
                setNav("starred");
                setSelectedId(null);
              }}
            >
              Starred
            </button>
            <button
              type="button"
              className={nav === "spam" ? "active" : ""}
              onClick={() => {
                setNav("spam");
                setSelectedId(null);
              }}
            >
              Spam
            </button>
          </nav>
          <div className="gm-nav-foot">
            <p>ScamShield demo</p>
            <p>Genuine · Phishing · Spam</p>
          </div>
        </aside>

        {/* List or reading pane */}
        <main className="gm-main">
          {!selected ? (
            <div className="gm-list-wrap">
              <div className="gm-list-toolbar">
                <span className="gm-list-title">
                  {nav === "inbox"
                    ? "Inbox"
                    : nav === "starred"
                      ? "Starred"
                      : "Spam"}
                </span>
                <span className="gm-list-sub">
                  Open any mail — ScamShield opens like Gemini
                </span>
              </div>
              <ul className="gm-list">
                {visible.map((mail) => {
                  const badge = categoryBadge(mail.category);
                  const t = trust[mail.fromEmail];
                  return (
                    <li key={mail.id}>
                      <button
                        type="button"
                        className={`gm-row ${mail.unread ? "gm-row--unread" : ""}`}
                        onClick={() => openMail(mail)}
                      >
                        <span
                          className={`gm-star ${mail.starred ? "on" : ""}`}
                          onClick={(e) => toggleStar(mail.id, e)}
                          role="presentation"
                        >
                          ★
                        </span>
                        <span
                          className="gm-row-avatar"
                          style={{ background: mail.avatarColor }}
                        >
                          {mail.fromName.charAt(0)}
                        </span>
                        <span className="gm-row-from">{mail.fromName}</span>
                        <span className="gm-row-mid">
                          <span className="gm-row-subj">{mail.subject}</span>
                          <span className="gm-row-snip"> — {mail.snippet}</span>
                        </span>
                        <span className={`gm-badge ${badge.cls}`}>
                          {t === "trusted"
                            ? "Trusted"
                            : t === "blocked"
                              ? "Blocked"
                              : badge.label}
                        </span>
                        <span className="gm-row-time">{mail.time}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="gm-read">
              <div className="gm-read-toolbar">
                <button
                  type="button"
                  className="gm-icon-btn"
                  onClick={() => {
                    setSelectedId(null);
                    setShowTrustModal(false);
                  }}
                  aria-label="Back to inbox"
                >
                  ←
                </button>
                <button type="button" className="gm-tool" title="Archive">
                  ⬇
                </button>
                <button
                  type="button"
                  className="gm-tool"
                  title="Report spam"
                  onClick={() =>
                    selected &&
                    setSenderTrust(selected.fromEmail, "blocked", selected.id)
                  }
                >
                  ⚠
                </button>
                <button
                  type="button"
                  className="gm-tool"
                  title="Delete"
                  onClick={() => {
                    setMails((p) => p.filter((m) => m.id !== selected.id));
                    setSelectedId(null);
                  }}
                >
                  🗑
                </button>
                <div className="gm-read-spacer" />
                <button
                  type="button"
                  className={`gm-ss-launch ${panelOpen ? "on" : ""}`}
                  onClick={() => setPanelOpen((v) => !v)}
                >
                  ScamShield
                </button>
              </div>

              <div className="gm-read-scroll">
                <h1 className="gm-subject">{selected.subject}</h1>

                {trustStatus === "unknown" ? (
                  <div className="gm-trust-banner">
                    <div>
                      <strong>Do you trust this sender?</strong>
                      <p>
                        {selected.fromName} &lt;{selected.fromEmail}&gt; —
                        Outlook-style prompt powered by ScamShield.
                      </p>
                    </div>
                    <div className="gm-trust-banner-actions">
                      <button
                        type="button"
                        className="gm-btn-trust"
                        onClick={() =>
                          setSenderTrust(selected.fromEmail, "trusted")
                        }
                      >
                        Yes, I trust them
                      </button>
                      <button
                        type="button"
                        className="gm-btn-block"
                        onClick={() =>
                          setSenderTrust(
                            selected.fromEmail,
                            "blocked",
                            selected.id,
                          )
                        }
                      >
                        No, block sender
                      </button>
                    </div>
                  </div>
                ) : trustStatus === "blocked" ? (
                  <div className="gm-trust-banner gm-trust-banner--blocked">
                    <strong>Sender blocked</strong>
                    <p>You marked this address as untrusted.</p>
                  </div>
                ) : (
                  <div className="gm-trust-banner gm-trust-banner--ok">
                    <strong>Trusted sender</strong>
                    <p>You previously said you trust {selected.fromEmail}.</p>
                  </div>
                )}

                <div className="gm-msg-card">
                  <div className="gm-msg-head">
                    <span
                      className="gm-row-avatar lg"
                      style={{ background: selected.avatarColor }}
                    >
                      {selected.fromName.charAt(0)}
                    </span>
                    <div className="gm-msg-meta">
                      <div className="gm-msg-fromline">
                        <strong>{selected.fromName}</strong>
                        <span>&lt;{selected.fromEmail}&gt;</span>
                      </div>
                      <div className="gm-msg-to">to me</div>
                    </div>
                    <span className="gm-msg-time">{selected.time}</span>
                  </div>
                  <div
                    className="gm-msg-body"
                    dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Far-right rail + ScamShield panel */}
        <div className="gm-right">
          {panelOpen && selected ? (
            <ScamShieldMailPanel
              mail={selected}
              analysis={analysis}
              analyzing={analyzing}
              trustStatus={trustStatus}
              onClose={() => setPanelOpen(false)}
              onTrust={() => setSenderTrust(selected.fromEmail, "trusted")}
              onBlock={() =>
                setSenderTrust(selected.fromEmail, "blocked", selected.id)
              }
              onRecheck={() => void runAnalyze(selected)}
            />
          ) : null}
          <div className="gm-rail">
            <button
              type="button"
              className={`gm-rail-btn ${panelOpen && selected ? "on" : ""}`}
              title="ScamShield"
              onClick={() => {
                if (!selected && visible[0]) openMail(visible[0]);
                else setPanelOpen(true);
              }}
            >
              S
            </button>
            <span className="gm-rail-dot" />
            <span className="gm-rail-dot" />
            <span className="gm-rail-dot" />
          </div>
        </div>
      </div>

      {showTrustModal && selected ? (
        <TrustSenderModal
          mail={selected}
          analysis={analysis}
          analyzing={analyzing}
          onTrust={() => setSenderTrust(selected.fromEmail, "trusted")}
          onBlock={() =>
            setSenderTrust(selected.fromEmail, "blocked", selected.id)
          }
          onDismiss={() => setShowTrustModal(false)}
        />
      ) : null}
    </div>
  );
}
