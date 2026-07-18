"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
type NavId =
  | "inbox"
  | "starred"
  | "snoozed"
  | "sent"
  | "drafts"
  | "spam"
  | "archive";

type ComposeDraft = {
  to: string;
  subject: string;
  body: string;
  mode: "new" | "reply" | "forward";
};

type SentMail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  time: string;
};

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
      <path
        fill="#4285F4"
        d="M2 4v16h4V8.8l6 4.5V20h4V13.3l6-4.5V20h4V4L16 13 2 4z"
      />
      <path
        fill="#EA4335"
        d="M2 4l14 9 14-9v-1c0-1.7-1.3-3-3-3H5C3.3 0 2 1.3 2 3v1z"
      />
      <path fill="#34A853" d="M30 4v16c0 1.7-1.3 3-3 3h-1V8.8l4-4.8z" />
      <path fill="#FBBC04" d="M2 4l4 4.8V23H5c-1.7 0-3-1.3-3-3V4z" />
    </svg>
  );
}

export function GmailInbox() {
  const [mails, setMails] = useState(INBOX_MAILS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(true);
  const [nav, setNav] = useState<NavId>("inbox");
  const [trust, setTrust] = useState<TrustMap>({});
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [analysis, setAnalysis] = useState<EmailAnalysisResult | null>(null);
  const [analysisCache, setAnalysisCache] = useState<
    Record<string, EmailAnalysisResult>
  >({});
  const [analyzing, setAnalyzing] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<
    "all" | InboxCategory | "watch"
  >("all");
  const [draft, setDraft] = useState<ComposeDraft | null>(null);
  const [sentMails, setSentMails] = useState<SentMail[]>([]);
  const [draftMails, setDraftMails] = useState<SentMail[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [showSearchOpts, setShowSearchOpts] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showToMenu, setShowToMenu] = useState(false);
  const [blockedLink, setBlockedLink] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTrust(loadTrust());
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const selected = useMemo(
    () => mails.find((m) => m.id === selectedId) || null,
    [mails, selectedId],
  );

  const visible = useMemo(() => {
    let list = mails.filter((m) => !archived.has(m.id));

    if (nav === "archive") {
      list = mails.filter((m) => archived.has(m.id));
    } else if (nav === "starred") {
      list = list.filter((m) => m.starred && !snoozed.has(m.id));
    } else if (nav === "snoozed") {
      list = mails.filter((m) => snoozed.has(m.id) && !archived.has(m.id));
    } else if (nav === "spam") {
      list = list.filter((m) => m.category === "spam");
    } else if (nav === "inbox") {
      if (catFilter === "spam") {
        list = list.filter((m) => m.category === "spam" && !snoozed.has(m.id));
      } else {
        list = list.filter(
          (m) => m.category !== "spam" && !snoozed.has(m.id),
        );
      }
    } else if (nav === "sent") {
      // handled separately below
      list = [];
    } else if (nav === "drafts") {
      list = [];
    }

    const q = search.trim().toLowerCase();
    let filtered = list;
    if (catFilter === "watch" || catFilter === "phishing") {
      filtered = filtered.filter((m) => m.category === "phishing");
    } else if (catFilter === "genuine" || catFilter === "spam") {
      filtered = filtered.filter((m) => m.category === catFilter);
    }
    if (!q) return filtered;
    return filtered.filter(
      (m) =>
        m.fromName.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q) ||
        m.fromEmail.toLowerCase().includes(q),
    );
  }, [mails, nav, search, archived, snoozed, catFilter]);

  const sentVisible = useMemo(() => {
    if (nav !== "sent") return [];
    const q = search.trim().toLowerCase();
    if (!q) return sentMails;
    return sentMails.filter(
      (m) =>
        m.to.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q),
    );
  }, [nav, sentMails, search]);

  const draftsVisible = useMemo(() => {
    if (nav !== "drafts") return [];
    const q = search.trim().toLowerCase();
    if (!q) return draftMails;
    return draftMails.filter(
      (m) =>
        m.to.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q),
    );
  }, [nav, draftMails, search]);

  const unreadCount = mails.filter(
    (m) =>
      m.unread &&
      m.category !== "spam" &&
      !archived.has(m.id) &&
      !snoozed.has(m.id),
  ).length;

  const allVisibleChecked =
    visible.length > 0 && visible.every((m) => checked.has(m.id));

  const runAnalyze = useCallback(
    async (mail: InboxMail, force = false) => {
      if (!force && analysisCache[mail.id]) {
        setAnalysis(analysisCache[mail.id]);
        setAnalyzing(false);
        return;
      }
      setAnalyzing(true);
      if (!analysisCache[mail.id]) setAnalysis(null);
      try {
        const res = await fetch("/api/email-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw: mail.raw }),
        });
        if (!res.ok) throw new Error("fail");
        const data = (await res.json()) as EmailAnalysisResult;
        setAnalysis(data);
        setAnalysisCache((c) => ({ ...c, [mail.id]: data }));
      } catch {
        if (!analysisCache[mail.id]) setAnalysis(null);
        flash("Analysis failed — try again");
      } finally {
        setAnalyzing(false);
      }
    },
    [analysisCache, flash],
  );

  function openMail(mail: InboxMail) {
    setSelectedId(mail.id);
    setPanelOpen(true);
    setChecked(new Set());
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
      setLeavingId(mailId);
      window.setTimeout(() => {
        setMails((prev) =>
          prev.map((m) =>
            m.id === mailId ? { ...m, category: "spam" as const } : m,
          ),
        );
        setSelectedId(null);
        setLeavingId(null);
        flash(`Blocked ${email} · moved to Spam`);
      }, 280);
    } else {
      flash(`Trusted ${email}`);
    }
  }

  function toggleStar(id: string, e?: MouseEvent) {
    e?.stopPropagation();
    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)),
    );
  }

  function toggleCheck(id: string, e: MouseEvent) {
    e.stopPropagation();
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    if (allVisibleChecked) {
      setChecked(new Set());
      return;
    }
    setChecked(new Set(visible.map((m) => m.id)));
  }

  function targets(): string[] {
    if (checked.size) return [...checked];
    if (selectedId) return [selectedId];
    return [];
  }

  function archiveIds(ids: string[]) {
    if (!ids.length) return;
    setArchived((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => n.add(id));
      return n;
    });
    setChecked(new Set());
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    flash(`Archived ${ids.length} conversation${ids.length > 1 ? "s" : ""}`);
  }

  function deleteIds(ids: string[]) {
    if (!ids.length) return;
    setMails((prev) => prev.filter((m) => !ids.includes(m.id)));
    setChecked(new Set());
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    flash(`Deleted ${ids.length} conversation${ids.length > 1 ? "s" : ""}`);
  }

  function spamIds(ids: string[]) {
    if (!ids.length) return;
    setMails((prev) =>
      prev.map((m) =>
        ids.includes(m.id) ? { ...m, category: "spam" as const } : m,
      ),
    );
    setChecked(new Set());
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    flash(`Reported ${ids.length} as spam`);
  }

  function markUnreadIds(ids: string[]) {
    if (!ids.length) return;
    setMails((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, unread: true } : m)),
    );
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    flash("Marked as unread");
  }

  function snoozeIds(ids: string[]) {
    if (!ids.length) return;
    setSnoozed((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => n.add(id));
      return n;
    });
    setChecked(new Set());
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    flash(`Snoozed ${ids.length} · find them under Snoozed`);
  }

  function openCompose(mode: ComposeDraft["mode"], mail?: InboxMail) {
    if (mode === "reply" && mail) {
      setDraft({
        to: mail.fromEmail,
        subject: mail.subject.startsWith("Re:")
          ? mail.subject
          : `Re: ${mail.subject}`,
        body: `\n\nOn ${mail.time}, ${mail.fromName} wrote:\n> ${mail.snippet}`,
        mode,
      });
    } else if (mode === "forward" && mail) {
      setDraft({
        to: "",
        subject: mail.subject.startsWith("Fwd:")
          ? mail.subject
          : `Fwd: ${mail.subject}`,
        body: `\n\n---------- Forwarded message ----------\nFrom: ${mail.fromName} <${mail.fromEmail}>\nSubject: ${mail.subject}\n\n${mail.snippet}`,
        mode,
      });
    } else {
      setDraft({ to: "", subject: "", body: "", mode: "new" });
    }
  }

  function sendDraft() {
    if (!draft) return;
    if (!draft.to.trim()) {
      flash("Add a recipient first");
      return;
    }
    const item: SentMail = {
      id: `sent-${Date.now()}`,
      to: draft.to.trim(),
      subject: draft.subject || "(no subject)",
      body: draft.body,
      time: "Just now",
    };
    setSentMails((prev) => [item, ...prev]);
    setDraft(null);
    flash(
      draft.mode === "reply"
        ? `Reply sent to ${item.to}`
        : draft.mode === "forward"
          ? `Forwarded to ${item.to}`
          : `Message sent to ${item.to}`,
    );
  }

  function saveDraftAndClose() {
    if (!draft) return;
    if (draft.to.trim() || draft.subject.trim() || draft.body.trim()) {
      setDraftMails((prev) => [
        {
          id: `draft-${Date.now()}`,
          to: draft.to,
          subject: draft.subject || "(no subject)",
          body: draft.body,
          time: "Just now",
        },
        ...prev,
      ]);
      flash("Draft saved");
    } else {
      flash("Draft discarded");
    }
    setDraft(null);
  }

  function onBodyClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;
    e.preventDefault();
    e.stopPropagation();
    const href = anchor.getAttribute("href") || "(unknown link)";
    setBlockedLink(href);
    setPanelOpen(true);
    flash("ScamShield blocked the link");
  }

  function clearTrust(email: string) {
    const next = { ...trust };
    delete next[email];
    setTrust(next);
    saveTrust(next);
    flash("Trust cleared — choose again");
  }

  function resetPitchDemo() {
    localStorage.removeItem(TRUST_KEY);
    setTrust({});
    setMails(INBOX_MAILS.map((m) => ({ ...m })));
    setArchived(new Set());
    setSnoozed(new Set());
    setChecked(new Set());
    setAnalysisCache({});
    setAnalysis(null);
    setCatFilter("all");
    setSearch("");
    setNav("inbox");
    setSelectedId(null);
    setShowTrustModal(false);
    setPanelOpen(true);
    setDraft(null);
    setSentMails([]);
    setDraftMails([]);
    setBlockedLink(null);
    flash("Pitch reset — open HDFC for trust popup");
  }

  // Keyboard shortcuts like Gmail
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "e") {
        e.preventDefault();
        archiveIds(targets());
      } else if (e.key === "#") {
        e.preventDefault();
        deleteIds(targets());
      } else if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const id = selectedId || targets()[0];
        if (id) toggleStar(id);
      } else if (e.key === "u") {
        e.preventDefault();
        markUnreadIds(targets());
      } else if (e.key === "c") {
        e.preventDefault();
        openCompose("new");
      } else if (e.key === "Escape") {
        if (blockedLink) setBlockedLink(null);
        else if (showHelp) setShowHelp(false);
        else if (showSearchOpts) setShowSearchOpts(false);
        else if (showAccount) setShowAccount(false);
        else if (draft) setDraft(null);
        else if (showTrustModal) setShowTrustModal(false);
        else if (selectedId) setSelectedId(null);
        else setChecked(new Set());
      } else if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        if (!visible.length) return;
        const idx = selectedId
          ? visible.findIndex((m) => m.id === selectedId)
          : -1;
        const next =
          e.key === "j"
            ? visible[Math.min(visible.length - 1, idx + 1)] || visible[0]
            : visible[Math.max(0, idx - 1)] || visible[0];
        if (next) openMail(next);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, visible, draft, showTrustModal, checked, blockedLink, showHelp, showSearchOpts, showAccount]);

  const trustStatus = selected
    ? trust[selected.fromEmail] || "unknown"
    : "unknown";

  const risky =
    !!analysis &&
    (analysis.preventionLevel === "hard_stop" ||
      analysis.verdict === "phishing");

  const navItems: {
    id: NavId;
    label: string;
    count?: number;
    icon: ReactNode;
  }[] = [
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
      count: snoozed.size || undefined,
      icon: (
        <Icon>
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
        </Icon>
      ),
    },
    {
      id: "sent",
      label: "Sent",
      count: sentMails.length || undefined,
      icon: (
        <Icon>
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </Icon>
      ),
    },
    {
      id: "drafts",
      label: "Drafts",
      count: draftMails.length || undefined,
      icon: (
        <Icon>
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </Icon>
      ),
    },
    {
      id: "spam",
      label: "Spam",
      count:
        mails.filter((m) => m.category === "spam" && !archived.has(m.id))
          .length || undefined,
      icon: (
        <Icon>
          <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z" />
        </Icon>
      ),
    },
    {
      id: "archive",
      label: "Archive",
      count: archived.size || undefined,
      icon: (
        <Icon>
          <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
        </Icon>
      ),
    },
  ];

  return (
    <div className={`gm-app ${navCollapsed ? "gm-app--nav-collapsed" : ""}`}>
      <div className="gm-pitch-bar">
        <span>
          <strong>Pitch:</strong> open <em>HDFC</em> → trust popup → ScamShield
          STOP · click the verify link (blocked) · <kbd>j</kbd>/<kbd>k</kbd> ·{" "}
          <kbd>e</kbd> · <kbd>c</kbd>
        </span>
        <div className="gm-pitch-actions">
          <button
            type="button"
            className="gm-pitch-reset"
            onClick={resetPitchDemo}
          >
            Reset pitch
          </button>
          <Link href="/" className="gm-pitch-home">
            Home
          </Link>
        </div>
      </div>

      <header className="gm-top">
        <div className="gm-top-left">
          <button
            type="button"
            className="gm-icon-btn"
            aria-label="Main menu"
            aria-pressed={navCollapsed}
            onClick={() => setNavCollapsed((v) => !v)}
          >
            <Icon>
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </Icon>
          </button>
          <Link href="/" className="gm-logo" title="ScamShield home">
            <GmailLogo />
            <span className="gm-logo-text">Gmail</span>
          </Link>
        </div>

        <div className={`gm-search ${showSearchOpts ? "gm-search--opts" : ""}`}>
          <button
            type="button"
            className="gm-search-icon"
            aria-label="Search"
            onClick={() => searchRef.current?.focus()}
          >
            <Icon>
              <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </Icon>
          </button>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search mail"
            aria-label="Search mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowAccount(false)}
          />
          {search ? (
            <button
              type="button"
              className="gm-search-icon"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          ) : (
            <button
              type="button"
              className={`gm-search-icon ${showSearchOpts ? "on" : ""}`}
              aria-label="Show search options"
              aria-expanded={showSearchOpts}
              onClick={() => setShowSearchOpts((v) => !v)}
            >
              <Icon>
                <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
              </Icon>
            </button>
          )}
          {showSearchOpts ? (
            <div className="gm-search-panel" role="dialog" aria-label="Filters">
              <p>Quick filters</p>
              <div className="gm-search-chips">
                {(
                  [
                    ["all", "All mail"],
                    ["phishing", "Phishing"],
                    ["genuine", "Genuine"],
                    ["spam", "Spam"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={catFilter === id ? "on" : ""}
                    onClick={() => {
                      setCatFilter(id);
                      setNav("inbox");
                      setShowSearchOpts(false);
                      flash(`Filter: ${label}`);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="gm-top-right">
          <button
            type="button"
            className="gm-icon-btn"
            title="Keyboard shortcuts"
            aria-label="Help"
            onClick={() => setShowHelp(true)}
          >
            <Icon>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
            </Icon>
          </button>
          <Link href="/check" className="gm-top-link">
            Checker
          </Link>
          <button
            type="button"
            className={`gm-ss-top-btn ${panelOpen && selected ? "on" : ""}`}
            title="ScamShield"
            onClick={() => {
              if (!selected && visible[0]) openMail(visible[0]);
              else setPanelOpen((v) => !v);
            }}
          >
            S
          </button>
          <div className="gm-account-wrap">
            <button
              type="button"
              className="gm-avatar"
              title="Account"
              aria-expanded={showAccount}
              onClick={() => setShowAccount((v) => !v)}
            >
              Y
            </button>
            {showAccount ? (
              <div className="gm-account-menu" role="menu">
                <p>
                  <strong>you@gmail.com</strong>
                  <br />
                  ScamShield demo account
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(TRUST_KEY);
                    setTrust({});
                    setShowAccount(false);
                    flash("Trust choices cleared");
                  }}
                >
                  Clear trust memory
                </button>
                <Link href="/" onClick={() => setShowAccount(false)}>
                  Exit to landing
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="gm-body">
        <aside className="gm-nav">
          <button
            type="button"
            className="gm-compose"
            onClick={() => openCompose("new")}
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
                  setChecked(new Set());
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
            </div>
            <button
              type="button"
              className="gm-label-row"
              onClick={() => {
                setCatFilter("watch");
                setNav("inbox");
                setSearch("");
                setSelectedId(null);
                flash("ScamShield watch — phishing demos");
              }}
            >
              <span className="gm-label-dot" style={{ background: "#d93025" }} />
              ScamShield watch
            </button>
            <button
              type="button"
              className="gm-label-row"
              onClick={() => {
                setCatFilter("genuine");
                setNav("inbox");
                setSearch("");
                setSelectedId(null);
                flash("Showing genuine mail");
              }}
            >
              <span className="gm-label-dot" style={{ background: "#0d9488" }} />
              Trusted / genuine
            </button>
          </div>
        </aside>

        <main className="gm-main">
          {!selected ? (
            <div className="gm-list-wrap">
              <div className="gm-list-toolbar">
                <div className="gm-list-tools">
                  <button
                    type="button"
                    className={`gm-icon-btn ${allVisibleChecked ? "on" : ""}`}
                    aria-label="Select all"
                    onClick={toggleSelectAll}
                  >
                    <Icon>
                      {allVisibleChecked ? (
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      ) : (
                        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                      )}
                    </Icon>
                  </button>
                  {checked.size > 0 ? (
                    <>
                      <button
                        type="button"
                        className="gm-icon-btn"
                        title="Archive"
                        onClick={() => archiveIds([...checked])}
                      >
                        <Icon>
                          <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
                        </Icon>
                      </button>
                      <button
                        type="button"
                        className="gm-icon-btn"
                        title="Report spam"
                        onClick={() => spamIds([...checked])}
                      >
                        <Icon>
                          <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z" />
                        </Icon>
                      </button>
                      <button
                        type="button"
                        className="gm-icon-btn"
                        title="Delete"
                        onClick={() => deleteIds([...checked])}
                      >
                        <Icon>
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </Icon>
                      </button>
                      <button
                        type="button"
                        className="gm-icon-btn"
                        title="Mark unread"
                        onClick={() => markUnreadIds([...checked])}
                      >
                        <Icon>
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                        </Icon>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="gm-icon-btn"
                      aria-label="Refresh"
                      onClick={() => {
                        resetPitchDemo();
                        flash("Inbox refreshed · pitch ready");
                      }}
                    >
                      <Icon>
                        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                      </Icon>
                    </button>
                  )}
                </div>
                <span className="gm-list-range">
                  {checked.size
                    ? `${checked.size} selected`
                    : nav === "sent"
                      ? `${sentVisible.length} sent`
                      : nav === "drafts"
                        ? `${draftsVisible.length} drafts`
                        : `${visible.length} conversations`}
                </span>
              </div>

              {nav !== "sent" && nav !== "drafts" ? (
              <div className="gm-list-tabs" role="tablist" aria-label="Mail type">
                {(
                  [
                    ["all", "All"],
                    ["phishing", "Phishing"],
                    ["genuine", "Genuine"],
                    ["spam", "Spam"],
                  ] as const
                ).map(([id, label]) => {
                  const on =
                    catFilter === id ||
                    (id === "phishing" && catFilter === "watch");
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      className={on ? "on" : ""}
                      onClick={() => setCatFilter(id)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              ) : null}

              {nav === "sent" ? (
                <ul className="gm-list">
                  {sentVisible.length === 0 ? (
                    <li className="gm-empty">
                      <p>No sent mail yet — Compose and Send.</p>
                    </li>
                  ) : (
                    sentVisible.map((m) => (
                      <li key={m.id}>
                        <div className="gm-row">
                          <span className="gm-row-from">To: {m.to}</span>
                          <span className="gm-row-mid">
                            <span className="gm-row-subj">{m.subject}</span>
                            <span className="gm-row-snip"> – {m.body.slice(0, 80)}</span>
                          </span>
                          <span className="gm-row-time">{m.time}</span>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              ) : nav === "drafts" ? (
                <ul className="gm-list">
                  {draftsVisible.length === 0 ? (
                    <li className="gm-empty">
                      <p>No drafts — close Compose with text to save one.</p>
                    </li>
                  ) : (
                    draftsVisible.map((m) => (
                      <li key={m.id}>
                        <div
                          className="gm-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setDraft({
                              to: m.to,
                              subject: m.subject,
                              body: m.body,
                              mode: "new",
                            });
                            setDraftMails((prev) =>
                              prev.filter((d) => d.id !== m.id),
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setDraft({
                                to: m.to,
                                subject: m.subject,
                                body: m.body,
                                mode: "new",
                              });
                              setDraftMails((prev) =>
                                prev.filter((d) => d.id !== m.id),
                              );
                            }
                          }}
                        >
                          <span className="gm-row-from">Draft</span>
                          <span className="gm-row-mid">
                            <span className="gm-row-subj">{m.subject}</span>
                            <span className="gm-row-snip"> – {m.body.slice(0, 80)}</span>
                          </span>
                          <span className="gm-row-time">{m.time}</span>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              ) : visible.length === 0 ? (
                <div className="gm-empty">
                  <p>No conversations in this view.</p>
                  {nav !== "inbox" ? (
                    <button
                      type="button"
                      className="gm-empty-btn"
                      onClick={() => setNav("inbox")}
                    >
                      Back to Inbox
                    </button>
                  ) : null}
                </div>
              ) : (
                <ul className="gm-list">
                  {visible.map((mail) => {
                    const badge = categoryBadge(mail.category);
                    const t = trust[mail.fromEmail];
                    const isChecked = checked.has(mail.id);
                    return (
                      <li key={mail.id}>
                        <div
                          className={`gm-row ${mail.unread ? "gm-row--unread" : ""} ${isChecked ? "gm-row--checked" : ""} ${mail.id === "phish-hdfc" ? "gm-row--phish-hint" : ""} ${leavingId === mail.id ? "gm-row--leave" : ""}`}
                          onClick={() => openMail(mail)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") openMail(mail);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <button
                            type="button"
                            className={`gm-row-check ${isChecked ? "on" : ""}`}
                            aria-label="Select"
                            onClick={(e) => toggleCheck(mail.id, e)}
                          >
                            <Icon size={18}>
                              {isChecked ? (
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              ) : (
                                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                              )}
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
                          <div className="gm-row-actions">
                            <button
                              type="button"
                              title="Archive"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveIds([mail.id]);
                              }}
                            >
                              ⬇
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteIds([mail.id]);
                              }}
                            >
                              🗑
                            </button>
                            <button
                              type="button"
                              title="Mark unread"
                              onClick={(e) => {
                                e.stopPropagation();
                                markUnreadIds([mail.id]);
                              }}
                            >
                              ✉
                            </button>
                          </div>
                          <span className="gm-row-time">{mail.time}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div
              className={`gm-read ${leavingId === selected.id ? "gm-read--leave" : ""}`}
            >
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
                <button
                  type="button"
                  className="gm-icon-btn"
                  title="Archive (e)"
                  onClick={() => archiveIds([selected.id])}
                >
                  <Icon>
                    <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
                  </Icon>
                </button>
                <button
                  type="button"
                  className="gm-icon-btn"
                  title="Report spam"
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
                  onClick={() => deleteIds([selected.id])}
                >
                  <Icon>
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </Icon>
                </button>
                <span className="gm-tool-sep" />
                <button
                  type="button"
                  className="gm-icon-btn"
                  title="Mark unread (u)"
                  onClick={() => markUnreadIds([selected.id])}
                >
                  <Icon>
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                  </Icon>
                </button>
                <button
                  type="button"
                  className="gm-icon-btn"
                  title="Snooze"
                  onClick={() => snoozeIds([selected.id])}
                >
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
                  <div
                    className={`gm-trust-banner ${risky ? "gm-trust-banner--risk" : ""}`}
                  >
                    <div>
                      <strong>Do you trust this sender?</strong>
                      <p>
                        {selected.fromName} &lt;{selected.fromEmail}&gt;
                        {risky ? " · ScamShield flags this as high risk" : ""}
                      </p>
                    </div>
                    <div className="gm-trust-banner-actions">
                      {!risky ? (
                        <button
                          type="button"
                          className="gm-btn-trust"
                          onClick={() =>
                            setSenderTrust(selected.fromEmail, "trusted")
                          }
                        >
                          Yes, I trust them
                        </button>
                      ) : null}
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
                      {risky ? (
                        <button
                          type="button"
                          className="gm-btn-trust gm-btn-trust--ghost"
                          onClick={() =>
                            setSenderTrust(selected.fromEmail, "trusted")
                          }
                        >
                          Trust anyway
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : trustStatus === "blocked" ? (
                  <div className="gm-trust-banner gm-trust-banner--blocked">
                    <strong>Sender blocked</strong>
                    <p>Moved toward Spam by your choice.</p>
                  </div>
                ) : (
                  <div className="gm-trust-banner gm-trust-banner--ok">
                    <div>
                      <strong>Trusted sender</strong>
                      <p>You trust {selected.fromEmail} on this device.</p>
                    </div>
                    <div className="gm-trust-banner-actions">
                      <button
                        type="button"
                        className="gm-btn-block"
                        onClick={() => clearTrust(selected.fromEmail)}
                      >
                        Revoke trust
                      </button>
                    </div>
                  </div>
                )}

                <div className="gm-msg-card gm-msg-card--in">
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
                        <button
                          type="button"
                          className="gm-unsub"
                          onClick={() =>
                            flash("Unsubscribe saved (demo) — still verify links")
                          }
                        >
                          Unsubscribe
                        </button>
                      </div>
                      <div className="gm-msg-to">
                        <button
                          type="button"
                          className="gm-to-btn"
                          onClick={() => setShowToMenu((v) => !v)}
                        >
                          to me ▾
                        </button>
                        {showToMenu ? (
                          <div className="gm-to-menu">
                            <p>
                              Delivered to <strong>you@gmail.com</strong>
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(
                                  selected.raw,
                                );
                                setShowToMenu(false);
                                flash("Copied raw email to clipboard");
                              }}
                            >
                              Copy raw source
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPanelOpen(true);
                                setShowToMenu(false);
                              }}
                            >
                              Open ScamShield
                            </button>
                          </div>
                        ) : null}
                      </div>
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
                      <button
                        type="button"
                        className="gm-icon-btn sm"
                        aria-label="Reply"
                        onClick={() => openCompose("reply", selected)}
                      >
                        <Icon size={18}>
                          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                        </Icon>
                      </button>
                    </div>
                  </div>
                  <div
                    className="gm-msg-body"
                    onClick={onBodyClick}
                    dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
                  />
                  <div className="gm-msg-actions">
                    <button
                      type="button"
                      className="gm-reply-btn"
                      onClick={() => openCompose("reply", selected)}
                    >
                      <Icon size={18}>
                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                      </Icon>
                      Reply
                    </button>
                    <button
                      type="button"
                      className="gm-reply-btn"
                      onClick={() => openCompose("forward", selected)}
                    >
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
              onRecheck={() => void runAnalyze(selected, true)}
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
            <button
              type="button"
              className="gm-rail-app"
              title="Calendar"
              style={{ color: "#1a73e8" }}
              onClick={() => {
                if (selected) {
                  snoozeIds([selected.id]);
                  flash("Snoozed until later (calendar demo)");
                } else flash("Open a mail, then snooze from Calendar");
              }}
            >
              <Icon size={20}>
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
              </Icon>
            </button>
            <button
              type="button"
              className="gm-rail-app"
              title="Keep"
              style={{ color: "#f9ab00" }}
              onClick={() => {
                const note = analysis
                  ? `ScamShield note: ${analysis.verdict} · ${analysis.riskScore}/100 · ${analysis.plainSummary || analysis.summary}`
                  : "Open a mail to save a ScamShield note";
                void navigator.clipboard.writeText(note);
                flash("Note copied to clipboard (Keep demo)");
              }}
            >
              <Icon size={20}>
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
              </Icon>
            </button>
            <button
              type="button"
              className="gm-rail-app"
              title="Tasks"
              style={{ color: "#1a73e8" }}
              onClick={() => {
                if (analysis?.hardStops?.length) {
                  flash(`Tasks: ${analysis.hardStops[0].replace(/^DO NOT\s+/i, "")}`);
                  setPanelOpen(true);
                } else flash("Open a risky mail to load STOP tasks");
              }}
            >
              <Icon size={20}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </Icon>
            </button>
          </div>
        </div>
      </div>

      {draft ? (
        <div className="gm-compose-pop" role="dialog" aria-label="Compose">
          <div className="gm-compose-pop-head">
            <strong>
              {draft.mode === "reply"
                ? "Reply"
                : draft.mode === "forward"
                  ? "Forward"
                  : "New Message"}
            </strong>
            <button
              type="button"
              className="gm-icon-btn sm"
              onClick={() => setDraft(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="gm-compose-fields">
            <label>
              To
              <input
                value={draft.to}
                onChange={(e) =>
                  setDraft({ ...draft, to: e.target.value })
                }
                placeholder="recipient@email.com"
              />
            </label>
            <label>
              Subject
              <input
                value={draft.subject}
                onChange={(e) =>
                  setDraft({ ...draft, subject: e.target.value })
                }
              />
            </label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Write your message…"
              rows={8}
            />
          </div>
          <div className="gm-compose-actions">
            <button type="button" className="gm-send-btn" onClick={sendDraft}>
              Send
            </button>
            <button
              type="button"
              className="gm-compose-discard"
              onClick={saveDraftAndClose}
            >
              Save &amp; close
            </button>
          </div>
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

      {blockedLink ? (
        <div
          className="gm-modal-backdrop"
          role="presentation"
          onClick={() => setBlockedLink(null)}
        >
          <div
            className="gm-modal gm-modal--high"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gm-link-stop-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gm-modal-top">
              <span className="gm-ss-mark">S</span>
              <span>ScamShield</span>
              <button
                type="button"
                className="gm-icon-btn"
                onClick={() => setBlockedLink(null)}
              >
                ✕
              </button>
            </div>
            <h2 id="gm-link-stop-title">HARD STOP — link blocked</h2>
            <p className="gm-modal-alert">
              ScamShield intercepted this click so you don’t land on a fake
              page.
            </p>
            <p className="gm-modal-from">
              <code>{blockedLink}</code>
            </p>
            <div className="gm-modal-actions">
              <button
                type="button"
                className="gm-btn-block"
                onClick={() => {
                  if (selected) {
                    setSenderTrust(
                      selected.fromEmail,
                      "blocked",
                      selected.id,
                    );
                  }
                  setBlockedLink(null);
                }}
              >
                Block sender
              </button>
              <button
                type="button"
                className="gm-btn-trust gm-btn-trust--ghost"
                onClick={() => setBlockedLink(null)}
              >
                Stay safe — close
              </button>
            </div>
            <p className="gm-modal-hint">
              Open your real bank app yourself. Never tap “verify” links from
              email.
            </p>
          </div>
        </div>
      ) : null}

      {showHelp ? (
        <div
          className="gm-modal-backdrop"
          role="presentation"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="gm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gm-help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gm-modal-top">
              <span className="gm-ss-mark">S</span>
              <span>Shortcuts</span>
              <button
                type="button"
                className="gm-icon-btn"
                onClick={() => setShowHelp(false)}
              >
                ✕
              </button>
            </div>
            <h2 id="gm-help-title">Keyboard shortcuts</h2>
            <ul className="gm-help-list">
              <li>
                <kbd>j</kbd> / <kbd>k</kbd> — next / previous mail
              </li>
              <li>
                <kbd>e</kbd> — archive
              </li>
              <li>
                <kbd>u</kbd> — mark unread
              </li>
              <li>
                <kbd>s</kbd> — star
              </li>
              <li>
                <kbd>c</kbd> — compose
              </li>
              <li>
                <kbd>Esc</kbd> — back / close
              </li>
              <li>
                <kbd>#</kbd> — delete
              </li>
            </ul>
            <button
              type="button"
              className="gm-btn-trust"
              onClick={() => setShowHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="gm-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
