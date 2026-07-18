export type ParsedEmail = {
  raw: string;
  displayName: string | null;
  fromEmail: string | null;
  fromDomain: string | null;
  replyTo: string | null;
  returnPath: string | null;
  subject: string | null;
  body: string;
  urls: string[];
  attachments: string[];
  headersRaw: string | null;
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  hasHeaderBlock: boolean;
};

const EMAIL_RE = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const URL_RE =
  /https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+/gi;

function headerValue(block: string, name: string): string | null {
  const re = new RegExp(`^${name}:\\s*(.+)$`, "im");
  const m = block.match(re);
  return m?.[1]?.trim() || null;
}

function parseFrom(fromLine: string | null): {
  displayName: string | null;
  email: string | null;
  domain: string | null;
} {
  if (!fromLine) return { displayName: null, email: null, domain: null };
  const angle = fromLine.match(/^(?:"?([^"<]*)"?\s*)?<\s*([^>]+)\s*>$/);
  let email: string | null = null;
  let displayName: string | null = null;
  if (angle) {
    displayName = angle[1]?.trim() || null;
    email = angle[2].trim();
  } else {
    const e = fromLine.match(EMAIL_RE);
    email = e?.[0] || null;
    displayName = email ? fromLine.replace(email, "").replace(/[<>]/g, "").trim() || null : fromLine.trim();
  }
  const domain = email?.split("@")[1]?.toLowerCase() || null;
  return { displayName, email: email?.toLowerCase() || null, domain };
}

function extractAttachments(text: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /attachment[s]?:\s*([^\n]+)/gi,
    /filename\*?=\s*"?([^";\n]+)"?/gi,
    /Content-Disposition:.*filename="?([^";\n]+)"?/gi,
    /\b([\w.\-]+\.(?:exe|scr|js|vbs|bat|cmd|docm|xlsm|iso|zip|rar|apk|pdf|docx?|xlsx?))\b/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const part = m[1] || m[0];
      part.split(/[,;]/).forEach((p) => {
        const t = p.trim();
        if (t.includes(".")) names.add(t);
      });
    }
  }
  return [...names].slice(0, 20);
}

function authResult(headers: string, kind: "spf" | "dkim" | "dmarc"): string | null {
  const lower = headers.toLowerCase();
  if (kind === "spf") {
    const m = lower.match(/spf[=:][\s]*([a-z]+)/i) || lower.match(/\bspf\s+(pass|fail|softfail|neutral)/i);
    return m?.[1]?.toUpperCase() || null;
  }
  if (kind === "dkim") {
    const m = lower.match(/dkim[=:][\s]*([a-z]+)/i);
    return m?.[1]?.toUpperCase() || null;
  }
  const m = lower.match(/dmarc[=:][\s]*([a-z]+)/i);
  return m?.[1]?.toUpperCase() || null;
}

/**
 * Parse pasted email / .eml / message text.
 * Works without full headers — marks headers as not provided.
 */
export function parseEmail(rawInput: string): ParsedEmail {
  const raw = rawInput.replace(/\r\n/g, "\n").trim();
  const headerSplit = raw.match(/^([\s\S]*?)\n\n([\s\S]*)$/);
  let headerBlock = "";
  let body = raw;
  let hasHeaderBlock = false;

  if (headerSplit && /^(from|to|subject|reply-to|return-path|received):/im.test(headerSplit[1])) {
    headerBlock = headerSplit[1];
    body = headerSplit[2];
    hasHeaderBlock = true;
  } else {
    // Soft parse: lines at top that look like headers
    const lines = raw.split("\n");
    const soft: string[] = [];
    let i = 0;
    for (; i < Math.min(lines.length, 40); i++) {
      if (/^(from|to|subject|reply-to|return-path|date|cc|bcc):\s*/i.test(lines[i])) {
        soft.push(lines[i]);
        hasHeaderBlock = true;
      } else if (soft.length && lines[i].trim() === "") {
        i++;
        break;
      } else if (soft.length === 0) {
        break;
      } else {
        break;
      }
    }
    if (soft.length) {
      headerBlock = soft.join("\n");
      body = lines.slice(i).join("\n");
    }
  }

  const fromLine = headerValue(headerBlock, "From") || raw.match(/^From:\s*(.+)$/im)?.[1] || null;
  const replyTo = headerValue(headerBlock, "Reply-To");
  const returnPath = headerValue(headerBlock, "Return-Path");
  const subject = headerValue(headerBlock, "Subject");
  const { displayName, email, domain } = parseFrom(fromLine);

  const urlMatches = (body + "\n" + raw).match(URL_RE) || [];
  const urls = [...new Set(urlMatches.map((u) => (u.startsWith("http") ? u : `https://${u}`)))];

  const headersRaw = hasHeaderBlock ? headerBlock : null;

  return {
    raw,
    displayName,
    fromEmail: email,
    fromDomain: domain,
    replyTo: replyTo?.match(EMAIL_RE)?.[0]?.toLowerCase() || replyTo,
    returnPath: returnPath?.replace(/[<>]/g, "").match(EMAIL_RE)?.[0]?.toLowerCase() || returnPath,
    subject,
    body: body.trim() || raw,
    urls,
    attachments: extractAttachments(raw),
    headersRaw,
    spf: headersRaw ? authResult(headersRaw, "spf") : null,
    dkim: headersRaw ? authResult(headersRaw, "dkim") : null,
    dmarc: headersRaw ? authResult(headersRaw, "dmarc") : null,
    hasHeaderBlock,
  };
}
