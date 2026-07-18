import Link from "next/link";
import { LandingLiveCheck } from "@/components/LandingLiveCheck";

const CHECKS = [
  {
    icon: "👤",
    name: "Sender",
    weight: "25%",
    line: "Fake banks, temp-mail, Reply-To tricks",
  },
  {
    icon: "💬",
    name: "Pressure",
    weight: "20%",
    line: "OTP, pay now, urgency, AnyDesk",
  },
  {
    icon: "🔗",
    name: "Links",
    weight: "20%",
    line: "Fake login pages & shady domains",
  },
  {
    icon: "📎",
    name: "Files",
    weight: "20%",
    line: "Dangerous names like .pdf.exe",
  },
  {
    icon: "🛡️",
    name: "Headers",
    weight: "15%",
    line: "SPF / DKIM / DMARC when present",
  },
];

const PATHS = [
  {
    icon: "📧",
    title: "In Mail",
    line: "Gmail-style inbox + ScamShield side panel",
    href: "/inbox",
    cta: "Open demo",
    primary: true,
  },
  {
    icon: "⚡",
    title: "Live check",
    line: "One-tap fake bank OTP on this page",
    href: "#live",
    cta: "Try here",
    primary: false,
  },
  {
    icon: "🔬",
    title: "Paste checker",
    line: "Full evidence pack + JSON report",
    href: "/check",
    cta: "Open checker",
    primary: false,
  },
];

const RULES = [
  { icon: "🚫", title: "Never share OTP by email" },
  { icon: "🎭", title: "From names are easy to fake" },
  { icon: "💣", title: "Don’t open surprise .exe files" },
  { icon: "🖥️", title: "Don’t share screen with “support”" },
];

export default function LandingPage() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <Link href="/" className="lp-brand">
          <span className="lp-mark">S</span>
          <span>
            <strong>ScamShield</strong>
            <em>Stop before you click</em>
          </span>
        </Link>
        <nav className="lp-nav-links">
          <Link href="/inbox">In Mail</Link>
          <Link href="/check">Checker</Link>
          <Link href="/inbox" className="lp-cta">
            Pitch demo →
          </Link>
        </nav>
      </header>

      <section className="lp-hero">
        <p className="lp-kicker">Hackathon pitch · 90s demo</p>
        <h1 className="font-display">
          Weird email?
          <br />
          <span className="lp-hero-accent">We stop the trap.</span>
        </h1>
        <p className="lp-lead">
          Paste or open mail → multi-factor check → HARD STOP before OTP, pay,
          files, or screen share.
        </p>
        <div className="lp-hero-actions">
          <Link href="/inbox" className="lp-btn-primary lp-btn-lg">
            ▶ Open In Mail demo
          </Link>
          <Link href="/check" className="lp-btn-ghost lp-btn-lg">
            Paste an email
          </Link>
        </div>
      </section>

      <section className="lp-section lp-paths">
        <div className="lp-path-grid">
          {PATHS.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className={`lp-path-card ${p.primary ? "lp-path-card--primary" : ""}`}
            >
              <span className="lp-path-icon" aria-hidden>
                {p.icon}
              </span>
              <h3>{p.title}</h3>
              <p>{p.line}</p>
              <span className="lp-path-cta">{p.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="params" className="lp-section">
        <div className="lp-section-head">
          <h2 className="font-display">5 checks. One STOP.</h2>
          <p>No single keyword decides — we blend these signals.</p>
        </div>
        <div className="lp-check-grid">
          {CHECKS.map((c) => (
            <article key={c.name} className="lp-check-card">
              <div className="lp-check-icon" aria-hidden>
                {c.icon}
              </div>
              <div className="lp-check-meta">
                <h3>{c.name}</h3>
                <span>{c.weight}</span>
              </div>
              <p>{c.line}</p>
            </article>
          ))}
        </div>
      </section>

      <div id="live">
        <LandingLiveCheck />
      </div>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2 className="font-display">Remember these 4</h2>
          <p>Short rules. That’s all.</p>
        </div>
        <div className="lp-rule-grid">
          {RULES.map((r) => (
            <article key={r.title} className="lp-rule-card">
              <span aria-hidden>{r.icon}</span>
              <h3>{r.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-finale">
        <h2 className="font-display">Pitch path</h2>
        <ol className="lp-pitch-steps">
          <li>
            <strong>In Mail</strong> → open HDFC OTP
          </li>
          <li>
            <strong>Trust popup</strong> + ScamShield STOP
          </li>
          <li>
            <strong>Checklist</strong> shows flagged factors
          </li>
        </ol>
        <Link href="/inbox" className="lp-btn-primary lp-btn-lg">
          Launch demo now
        </Link>
      </section>

      <footer className="lp-foot">
        <p>ScamShield · Neural Nexus · Cursor Hackathon</p>
      </footer>
    </div>
  );
}
