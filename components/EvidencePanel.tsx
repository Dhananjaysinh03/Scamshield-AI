import type { EmailAnalysisResult } from "@/lib/email/types";

type Props = {
  result: EmailAnalysisResult;
};

function AuthBadge({ value }: { value: string | null }) {
  if (!value) {
    return <span className="auth-badge auth-badge--missing">not present</span>;
  }
  const v = value.toUpperCase();
  const ok = /\bPASS\b/.test(v);
  const fail = /\bFAIL\b|\bSOFTFAIL\b|\bNONE\b/.test(v);
  return (
    <span
      className={`auth-badge ${ok ? "auth-badge--pass" : fail ? "auth-badge--fail" : "auth-badge--neutral"}`}
    >
      {value}
    </span>
  );
}

/** Live evidence from the analyzer — not marketing copy */
export function EvidencePanel({ result }: Props) {
  const s = result.technicalFindings.sender;
  const urls = result.technicalFindings.urls.items;
  const files = result.technicalFindings.attachments.items;
  const headers = result.technicalFindings.headers;
  const social = result.technicalFindings.content.socialEngineering;

  return (
    <div className="simple-card space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">
            Live evidence
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Parsed from your paste — not a canned story
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.confidence ? (
            <span className="evidence-chip">
              Confidence {result.confidence}
            </span>
          ) : null}
          {result.becTheme ? (
            <span className="evidence-chip evidence-chip--theme">
              {result.becTheme}
            </span>
          ) : null}
          {result.scamType.slice(0, 4).map((t) => (
            <span key={t} className="evidence-chip evidence-chip--scam">
              {t}
            </span>
          ))}
        </div>
      </div>

      <section className="evidence-block">
        <h3>Sender identity</h3>
        <dl className="evidence-dl">
          <div>
            <dt>Display name</dt>
            <dd>{s.displayName || "—"}</dd>
          </div>
          <div>
            <dt>From address</dt>
            <dd className="font-mono text-[12px] break-all">
              {s.email || "—"}
            </dd>
          </div>
          <div>
            <dt>Domain</dt>
            <dd className="font-mono text-[12px]">{s.domain || "—"}</dd>
          </div>
          <div>
            <dt>Reply-To</dt>
            <dd className="font-mono text-[12px] break-all">
              {s.replyTo || "same as From / none"}
            </dd>
          </div>
        </dl>
        {s.findings.length > 0 ? (
          <ul className="evidence-findings">
            {s.findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="evidence-block">
        <h3>
          Links scanned{" "}
          <span className="evidence-count">{urls.length}</span>
        </h3>
        {urls.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No links found in paste.</p>
        ) : (
          <ul className="space-y-2">
            {urls.map((u) => (
              <li key={u.url} className="evidence-item">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`auth-badge ${u.https ? "auth-badge--pass" : "auth-badge--fail"}`}
                  >
                    {u.https ? "HTTPS" : "Not HTTPS"}
                  </span>
                  <code className="min-w-0 flex-1 break-all text-[11px] text-[var(--ink)]">
                    {u.url}
                  </code>
                </div>
                {u.findings.length > 0 ? (
                  <ul className="evidence-findings mt-1.5">
                    {u.findings.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    No extra link warnings.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="evidence-block">
        <h3>
          Attachments / files{" "}
          <span className="evidence-count">{files.length}</span>
        </h3>
        {files.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            No attachment names detected.
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.name} className="evidence-item">
                <p className="font-mono text-sm font-semibold text-[var(--ink)]">
                  {f.name}
                </p>
                {f.findings.length > 0 ? (
                  <ul className="evidence-findings mt-1.5">
                    {f.findings.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="evidence-block">
        <h3>Auth headers</h3>
        {!headers.provided ? (
          <p className="text-sm text-[var(--ink-muted)]">
            No SPF / DKIM / DMARC in this paste. Forward as{" "}
            <strong className="text-[var(--ink)]">.eml</strong> or include
            Authentication-Results for a deeper check.
          </p>
        ) : (
          <>
            <dl className="evidence-dl">
              <div>
                <dt>SPF</dt>
                <dd>
                  <AuthBadge value={headers.spf} />
                </dd>
              </div>
              <div>
                <dt>DKIM</dt>
                <dd>
                  <AuthBadge value={headers.dkim} />
                </dd>
              </div>
              <div>
                <dt>DMARC</dt>
                <dd>
                  <AuthBadge value={headers.dmarc} />
                </dd>
              </div>
            </dl>
            {headers.findings.length > 0 ? (
              <ul className="evidence-findings">
                {headers.findings.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </section>

      {social.length > 0 ? (
        <section className="evidence-block">
          <h3>Pressure tactics detected</h3>
          <div className="flex flex-wrap gap-1.5">
            {social.map((x) => (
              <span key={x} className="evidence-chip">
                {x}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {result.technicalFindings.content.findings.length > 0 ? (
        <section className="evidence-block">
          <h3>Content findings</h3>
          <ul className="evidence-findings">
            {result.technicalFindings.content.findings.slice(0, 6).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
