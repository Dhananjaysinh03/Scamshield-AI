"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
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
type NavId = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "spam";

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
  if (cat === "phishing")
    return { label: "Phishing", cls: "gm-badge--phish" };
  if (cat === "spam") return { label: "Spam", cls: "gm-badge--spam" };
  return { label: "Genuine", cls: "gm-badge--ok" };
}

function Icon({
  children,
  size = 20,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function GmailLogo() {
  return (
    <svg width="30" height="24" viewBox="0 0 32 24" aria-hidden>
      <path fill="#4285F4" d="M2 4v16h4V8.8l6 4.5V20h4V13.3l6-4.5V20h4V4L16 13 2 4z" />
      <path fill="#EA4335" d="M2 4l14 9 14-9v-1c0-1.7-1.3-3-3-3H5C3.3 0 2 1.3 2 3v1z" />
      <path fill="#34A853" d="M30 4v16c0 1.7-1.3 3-3 3h-1V8.8l4-4.8z" />
      <path fill="#FBBC04" d="M2 4l4 4.8V23H5c-1.7 0-3-1.3-3-3V4z" />
    </svg>
  );
}

export function GmailInbox() {
  const [mails, setMails] = useState(INBOX_MAILS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [nav, setNav] = useState<NavId>("inbox");
  const [trust, setTrust] = useState<TrustMap>({});
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [analysis, setAnalysis] = useState<EmailAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    setTrust(loadTrust());
  }, []);

  const selected = useMemo(
    () => mails.find((m) => m.id === selectedId) || null,
    [mails, selectedId],
  );

  const visible = useMemo(() => {
    let list = mails;
    if (nav === "starred") list = mails.filter((m) => m.starred);
    else if (nav === "spam") list = mails.filter((m) => m.category === "spam");
    else if (nav === "inbox")
      list = mails.filter((m) => m.category !== "spam");
    else list = [];

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.fromName.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q) ||
        m.fromEmail.toLowerCase().includes(q),
    );
  }, [mails, nav, search]);

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
    setShowTrustModal(status === "unknown");
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

  const navItems: { id: NavId; label: string; count?: number; icon: ReactNode }[] =
    [
      {
        id: "inbox",
        label: "Inbox",
        count: unreadCount || undefined,
        icon: (
          <Icon>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.6c.7 1.2 2 2 3.4 2s2.7-.8 3.4-2H19v3zm-7-5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm7-8H5V5h14v1z" />
          </Icon>
        ),
      },
      {
        id: "starred",
        label: "Starred",
        icon: (
          <Icon>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </Icon>
        ),
      },
      {
        id: "snoozed",
        label: "Snoozed",
        icon: (
          <Icon>
            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
          </Icon>
        ),
      },
      {
        id: "sent",
        label: "Sent",
        icon: (
          <Icon>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </Icon>
        ),
      },
      {
        id: "drafts",
        label: "Drafts",
        count: 1,
        icon: (
          <Icon>
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </Icon>
        ),
      },
      {
        id: "spam",
        label: "Spam",
        icon: (
          <Icon>
            <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z" />
          </Icon>
        ),
      },
    ];

  return (
    <div className="gm-app">
      <div className="gm-pitch-bar">
        <span>
          <strong>Pitch:</strong> open the red <em>HDFC</em> mail → trust popup
          → ScamShield STOP + checklist
        </span>
        <Link href="/" className="gm-pitch-home">
          Home
        </Link>
      </div>
      <header className="gm-top">
        <div className="gm-top-left">
          <button type="button" className="gm-icon-btn" aria-label="Main menu">
            <Icon>
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </Icon>
          </button>
          <Link href="/" className="gm-logo" title="ScamShield home">
            <GmailLogo />
            <span className="gm-logo-text">Gmail</span>
          </Link>
        </div>

        <div className="gm-search">
          <button type="button" className="gm-search-icon" aria-label="Search">
            <Icon>
              <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </Icon>
          </button>
          <input
            type="search"
            placeholder="Search mail"
            aria-label="Search mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="gm-search-icon" aria-label="Show search options">
            <Icon>
              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
            </Icon>
          </button>
        </div>

        <div className="gm-top-right">
          <Link href="/check" className="gm-top-link">
            Checker
          </Link>
          <button type="button" className="gm-icon-btn" aria-label="Support" title="Support">
            <Icon>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
            </Icon>
          </button>
          <button type="button" className="gm-icon-btn" aria-label="Settings" title="Settings">
            <Icon>
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.32-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" />
            </Icon>
          </button>
          <button
            type="button"
            className={`gm-ss-top-btn ${panelOpen && selected ? "on" : ""}`}
            title="ScamShield"
            onClick={() => {
              if (!selected && visible[0]) openMail(visible[0]);
              else setPanelOpen(true);
            }}
          >
            S
          </button>
          <div className="gm-avatar" title="you@gmail.com">
            Y
          </div>
        </div>
      </header>

      <div className="gm-body">
        <aside className="gm-nav">
          <button
            type="button"
            className="gm-compose"
            onClick={() => setComposeOpen(true)}
          >
            <Icon size={24}>
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </Icon>
            Compose
          </button>

          <nav className="gm-nav-list">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={nav === item.id ? "active" : ""}
                onClick={() => {
                  setNav(item.id);
                  setSelectedId(null);
                }}
              >
                <span className="gm-nav-ico">{item.icon}</span>
                <span className="gm-nav-label">{item.label}</span>
                {item.count ? <b>{item.count}</b> : null}
              </button>
            ))}
          </nav>

          <div className="gm-labels">
            <div className="gm-labels-head">
              <span>Labels</span>
              <button type="button" className="gm-icon-btn sm" aria-label="Create label">
                +
              </button>
            </div>
            <button type="button" className="gm-label-row">
              <span className="gm-label-dot" style={{ background: "#f28b82" }} />
              ScamShield watch
            </button>
            <button type="button" className="gm-label-row">
              <span className="gm-label-dot" style={{ background: "#81c995" }} />
              Trusted
            </button>
          </div>

          <div className="gm-nav-foot">
            <p>Demo mailbox · ScamShield</p>
          </div>
        </aside>

        <main className="gm-main">
          {!selected ? (
            <div className="gm-list-wrap">
              <div className="gm-list-toolbar">
                <div className="gm-list-tools">
                  <button type="button" className="gm-icon-btn" aria-label="Select">
                    <Icon>
                      <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                    </Icon>
                  </button>
                  <button
                    type="button"
                    className="gm-icon-btn"
                    aria-label="Refresh"
                    onClick={() => setMails([...INBOX_MAILS])}
                  >
                    <Icon>
                      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    </Icon>
                  </button>
                  <button type="button" className="gm-icon-btn" aria-label="More">
                    <Icon>
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </Icon>
                  </button>
                </div>
                <span className="gm-list-range">
                  1–{visible.length} of {visible.length}
                </span>
              </div>

              {visible.length === 0 ? (
                <div className="gm-empty">
                  <p>No conversations in this view.</p>
                </div>
              ) : (
                <ul className="gm-list">
                  {visible.map((mail) => {
                    const badge = categoryBadge(mail.category);
                    const t = trust[mail.fromEmail];
                    return (
                      <li key={mail.id}>
                        <div
                          className={`gm-row ${mail.unread ? "gm-row--unread" : ""} ${mail.category === "phishing" && mail.id === "phish-hdfc" ? "gm-row--phish-hint" : ""}`}
                          onClick={() => openMail(mail)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") openMail(mail);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <button
                            type="button"
                            className="gm-row-check"
                            aria-label="Select"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon size={18}>
                              <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                            </Icon>
                          </button>
                          <button
                            type="button"
                            className={`gm-star ${mail.starred ? "on" : ""}`}
                            aria-label="Star"
                            onClick={(e) => toggleStar(mail.id, e)}
                          >
                            ★
                          </button>
                          <span className="gm-row-from">{mail.fromName}</span>
                          <span className="gm-row-mid">
                            <span className="gm-row-subj">{mail.subject}</span>
                            <span className="gm-row-snip">
                              {" "}
                              – {mail.snippet}
                            </span>
                          </span>
                          <span
                            className={`gm-badge ${
                              t === "trusted"
                                ? "gm-badge--ok"
                                : t === "blocked"
                                  ? "gm-badge--phish"
                                  : badge.cls
                            }`}
                          >
                            {t === "trusted"
                              ? "Trusted"
                              : t === "blocked"
                                ? "Blocked"
                                : badge.label}
                          </span>
                          <span className="gm-row-time">{mail.time}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
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
                  <Icon>
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </Icon>
                </button>
                <button type="button" className="gm-icon-btn" title="Archive" aria-label="Archive">
                  <Icon>
                    <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
                  </Icon>
                </button>
                <button
                  type="button"
                  className="gm-icon-btn"
                  title="Report spam"
                  aria-label="Report spam"
                  onClick={() =>
                    setSenderTrust(selected.fromEmail, "blocked", selected.id)
                  }
                >
                  <Icon>
                    <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z" />
                  </Icon>
                </button>
                <button
                  type="button"
                  className="gm-icon-btn"
                  title="Delete"
                  aria-label="Delete"
                  onClick={() => {
                    setMails((p) => p.filter((m) => m.id !== selected.id));
                    setSelectedId(null);
                  }}
                >
                  <Icon>
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </Icon>
                </button>
                <span className="gm-tool-sep" />
                <button type="button" className="gm-icon-btn" title="Mark unread" aria-label="Mark unread">
                  <Icon>
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                  </Icon>
                </button>
                <button type="button" className="gm-icon-btn" title="Snooze" aria-label="Snooze">
                  <Icon>
                    <path d="M7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm1-11h-1.75L8.25 15.15l1.4 1.4L13 12.7V9z" />
                  </Icon>
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
                <div className="gm-subject-row">
                  <h1 className="gm-subject">{selected.subject}</h1>
                  <span
                    className={`gm-badge ${categoryBadge(selected.category).cls}`}
                  >
                    {categoryBadge(selected.category).label}
                  </span>
                </div>

                {trustStatus === "unknown" ? (
                  <div className="gm-trust-banner">
                    <div>
                      <strong>Do you trust this sender?</strong>
                      <p>
                        {selected.fromName} &lt;{selected.fromEmail}&gt;
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
                    <p>Moved toward Spam by your choice.</p>
                  </div>
                ) : (
                  <div className="gm-trust-banner gm-trust-banner--ok">
                    <strong>Trusted sender</strong>
                    <p>You trust {selected.fromEmail} on this device.</p>
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
                        <button type="button" className="gm-unsub">
                          Unsubscribe
                        </button>
                      </div>
                      <div className="gm-msg-to">to me ▾</div>
                    </div>
                    <div className="gm-msg-aside">
                      <span className="gm-msg-time">{selected.time}</span>
                      <button
                        type="button"
                        className={`gm-star ${selected.starred ? "on" : ""}`}
                        onClick={(e) => toggleStar(selected.id, e)}
                        aria-label="Star"
                      >
                        ★
                      </button>
                      <button type="button" className="gm-icon-btn sm" aria-label="Reply">
                        <Icon size={18}>
                          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                        </Icon>
                      </button>
                    </div>
                  </div>
                  <div
                    className="gm-msg-body"
                    dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
                  />
                  <div className="gm-msg-actions">
                    <button type="button" className="gm-reply-btn">
                      <Icon size={18}>
                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                      </Icon>
                      Reply
                    </button>
                    <button type="button" className="gm-reply-btn">
                      <Icon size={18}>
                        <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
                      </Icon>
                      Forward
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

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
              className={`gm-rail-btn gm-rail-ss ${panelOpen && selected ? "on" : ""}`}
              title="ScamShield"
              onClick={() => {
                if (!selected && visible[0]) openMail(visible[0]);
                else setPanelOpen(true);
              }}
            >
              S
            </button>
            <button type="button" className="gm-rail-app" title="Calendar" style={{ color: "#8ab4f8" }}>
              <Icon size={20}>
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
              </Icon>
            </button>
            <button type="button" className="gm-rail-app" title="Keep" style={{ color: "#fdd663" }}>
              <Icon size={20}>
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
              </Icon>
            </button>
            <button type="button" className="gm-rail-app" title="Tasks" style={{ color: "#8ab4f8" }}>
              <Icon size={20}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </Icon>
            </button>
            <span className="gm-rail-sep" />
            <button type="button" className="gm-rail-app" title="Get add-ons" aria-label="Add">
              <Icon size={20}>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </Icon>
            </button>
          </div>
        </div>
      </div>

      {composeOpen ? (
        <div className="gm-compose-pop" role="dialog" aria-label="New message">
          <div className="gm-compose-pop-head">
            <strong>New Message</strong>
            <button
              type="button"
              className="gm-icon-btn sm"
              onClick={() => setComposeOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="gm-compose-pop-body">
            Demo only — open an inbox mail to run ScamShield (like Gemini in
            Gmail).
          </p>
          <button
            type="button"
            className="gm-compose-pop-go"
            onClick={() => {
              setComposeOpen(false);
              if (visible[0]) openMail(visible[0]);
            }}
          >
            Open first mail instead
          </button>
        </div>
      ) : null}

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
