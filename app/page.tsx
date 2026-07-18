import Link from "next/link";
import { LandingLiveCheck } from "@/components/LandingLiveCheck";

const PARAMS = [
  {
    name: "Who sent it",
    weight: "25%",
    detail:
      "Fake bank names, throwaway / temp-mail addresses, mismatched Reply-To, and lookalike domains.",
  },
  {
    name: "What it says",
    weight: "20%",
    detail:
      "OTP asks, payment pressure, fake prizes, urgency (“frozen in 24 hours”), AnyDesk / screen share.",
  },
  {
    name: "Links",
    weight: "20%",
    detail:
      "Fake login pages, weird endings like .xyz, shortened links that hide the real site.",
  },
  {
    name: "Files",
    weight: "20%",
    detail:
      "Dangerous names like .exe or invoice.pdf.exe — we warn from the name; we never open the virus.",
  },
  {
    name: "Headers",
    weight: "15%",
    detail:
      "SPF / DKIM / DMARC only if you paste them. We never invent a PASS.",
  },
];

const KNOW = [
  {
    title: "Banks never ask for OTP by email",
    body: "If a message wants the code from your SMS, it’s almost always a trap.",
  },
  {
    title: "From names are easy to fake",
    body: "Anyone can type “HDFC Bank” as the display name. Check the real address behind it.",
  },
  {
    title: "“Gift” files can be malware",
    body: "Don’t open surprise attachments — especially double endings like .pdf.exe.",
  },
  {
    title: "Never share your screen with “support”",
    body: "AnyDesk / TeamViewer from a cold email is how accounts get emptied.",
  },
  {
    title: "Same scam IDs show up again",
    body: "ScamShield remembers when a From address or domain was flagged often — so you can spot repeat offenders.",
  },
  {
    title: "When unsure, don’t click",
    body: "Open your bank app yourself, or call a number you already know — not one from the email.",
  },
];

export default function LandingPage() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <Link href="/" className="lp-brand">
          <span className="lp-mark">S</span>
          <span>
            <strong>ScamShield</strong>
            <em>Email scam check</em>
          </span>
        </Link>
        <nav className="lp-nav-links">
          <a href="#live">Live check</a>
          <a href="#params">What we check</a>
          <a href="#know">Stay safe</a>
          <Link href="/check" className="lp-cta">
            Full product
          </Link>
        </nav>
      </header>

      <section className="lp-hero">
        <p className="lp-kicker">One problem · one product</p>
        <h1 className="font-display">
          Got a weird email?
          <br />
          <span className="lp-hero-accent">Stop before you click.</span>
        </h1>
        <p className="lp-lead">
          ScamShield checks suspicious emails in plain language — then tells you
          not to share OTP, pay money, open a file, or share your screen.
        </p>
        <div className="lp-hero-actions">
          <a href="#live" className="lp-btn-primary">
            Run live check here
          </a>
          <Link href="/check" className="lp-btn-ghost">
            Open full product
          </Link>
        </div>
        <p className="lp-fine">
          Real engine on every check — sender parse, link scan, file names, SPF
          headers when present. We never open virus files.
        </p>
      </section>

      <div id="live">
        <LandingLiveCheck />
      </div>

      <section id="how" className="lp-section">
        <h2 className="font-display">How it works</h2>
        <ol className="lp-steps">
          <li>
            <strong>Paste</strong> the email (or run the built-in demo).
          </li>
          <li>
            <strong>We score</strong> sender, words, links, files, and headers.
          </li>
          <li>
            <strong>STOP</strong> shows first if it asks for something you can’t
            undo.
          </li>
          <li>
            <strong>Learn</strong> the pattern so you spot it next time.
          </li>
        </ol>
      </section>

      <section id="params" className="lp-section lp-section-alt">
        <h2 className="font-display">What we check</h2>
        <p className="lp-section-lead">
          No single keyword decides. These parameters blend into one clear
          result for everyday people.
        </p>
        <div className="lp-param-grid">
          {PARAMS.map((p) => (
            <article key={p.name} className="lp-param-card">
              <div className="lp-param-top">
                <h3>{p.name}</h3>
                <span>{p.weight}</span>
              </div>
              <p>{p.detail}</p>
            </article>
          ))}
        </div>
        <div className="lp-rep-callout">
          <h3 className="font-display">Repeat scam email IDs</h3>
          <p>
            If the same From address or domain keeps showing up in scam-style
            checks, ScamShield flags it:{" "}
            <em>“This email ID is often used for scams.”</em> That’s a warning —
            still verify before you act.
          </p>
        </div>
      </section>

      <section id="know" className="lp-section">
        <h2 className="font-display">What everyone should know</h2>
        <div className="lp-know-grid">
          {KNOW.map((k) => (
            <article key={k.title} className="lp-know-card">
              <h3>{k.title}</h3>
              <p>{k.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-finale">
        <h2 className="font-display">Check an email in seconds</h2>
        <p>
          Paste a suspicious message — or tap the live fake-bank demo — and see
          a clear STOP when it matters.
        </p>
        <Link href="/check" className="lp-btn-primary">
          Open ScamShield check
        </Link>
      </section>

      <footer className="lp-foot">
        <p>ScamShield · email scam prevention for everyday people</p>
        <p>Neural Nexus · Cursor Hackathon · Not an enterprise gateway</p>
      </footer>
    </div>
  );
}
