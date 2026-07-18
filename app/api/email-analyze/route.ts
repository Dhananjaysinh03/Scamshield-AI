import { NextResponse } from "next/server";
import { analyzeEmailRaw } from "@/lib/email/analyzeEmail";
import type { EmailAnalysisResult } from "@/lib/email/types";
import { EMAIL_DEMOS, FEATURED_DEMO_ID } from "@/lib/email/demos";
import {
  lookupSenderReputation,
  recordPhishingSender,
  reputationStats,
} from "@/lib/email/senderReputation";
import Exa from "exa-js";

export const runtime = "nodejs";
export const maxDuration = 30;

async function enrichUrlsWithExa(
  result: EmailAnalysisResult,
): Promise<{ result: EmailAnalysisResult; enriched: boolean }> {
  const key = process.env.EXA_API_KEY;
  if (!key || result.technicalFindings.urls.items.length === 0) {
    return { result, enriched: false };
  }

  try {
    const exa = new Exa(key);
    const enriched = [...result.technicalFindings.urls.items];
    let hit = false;

    await Promise.all(
      enriched.slice(0, 3).map(async (item, idx) => {
        try {
          let host = item.url;
          try {
            host = new URL(item.url).hostname;
          } catch {
            /* keep */
          }
          const res = await exa.search(
            `"${host}" (phishing OR scam OR fraud OR "fake")`,
            {
              type: "auto",
              numResults: 2,
              contents: { text: { maxCharacters: 200 } },
            },
          );
          if (res.results?.length) {
            hit = true;
            enriched[idx] = {
              ...item,
              findings: [
                ...item.findings,
                `Live intel: ${res.results.length} related public result(s) for ${host} — treat link with extra caution.`,
              ],
            };
          }
        } catch {
          /* keep static findings */
        }
      }),
    );

    return {
      enriched: hit,
      result: {
        ...result,
        technicalFindings: {
          ...result.technicalFindings,
          urls: { ...result.technicalFindings.urls, items: enriched },
        },
        meta: {
          ...result.meta,
          exaEnriched: hit,
        },
      },
    };
  } catch {
    return { result, enriched: false };
  }
}

/** Engine status + demo catalog (proves API is live) */
export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "scamshield-email-analyze",
    version: "1.2.0",
    factors: ["sender", "content", "urls", "attachments", "headers"],
    exa: Boolean(process.env.EXA_API_KEY),
    ocr: Boolean(process.env.OPENAI_API_KEY),
    reputation: reputationStats(),
    featuredDemo: FEATURED_DEMO_ID,
    demos: EMAIL_DEMOS.map((d) => ({
      id: d.id,
      label: d.label,
      line: d.line,
      expect: d.expect,
    })),
  });
}

/**
 * Multi-factor email analyzer + sender reputation.
 * POST { raw: string, officialDomain?: string }
 */
export async function POST(req: Request) {
  const wallStart = Date.now();
  try {
    const body = (await req.json()) as {
      raw?: string;
      email?: string;
      officialDomain?: string;
    };
    const raw = (body.raw || body.email || "").trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Paste an email or message in `raw`." },
        { status: 400 },
      );
    }
    if (raw.length < 8) {
      return NextResponse.json(
        {
          error:
            "Paste is too short. Include the From line and message body.",
        },
        { status: 400 },
      );
    }

    let result = analyzeEmailRaw(raw, {
      officialDomain: body.officialDomain,
      startedAt: wallStart,
    });
    const enriched = await enrichUrlsWithExa(result);
    result = enriched.result;

    const fromEmail = result.technicalFindings.sender.email;
    const fromDomain = result.technicalFindings.sender.domain;

    if (
      result.verdict === "phishing" ||
      result.preventionLevel === "hard_stop"
    ) {
      recordPhishingSender(fromEmail, fromDomain);
    }

    const senderReputation = lookupSenderReputation(fromEmail, fromDomain);
    result = {
      ...result,
      senderReputation,
      meta: {
        ...result.meta,
        durationMs: Math.max(1, Date.now() - wallStart),
        exaEnriched: enriched.enriched || result.meta.exaEnriched,
      },
    };

    if (
      senderReputation.plainMessage &&
      !result.reasons.some((r) => r.includes("often") || r.includes("flagged"))
    ) {
      result = {
        ...result,
        reasons: [senderReputation.plainMessage, ...result.reasons].slice(0, 8),
      };
    }

    const liveIntel = result.technicalFindings.urls.items
      .flatMap((u) => u.findings)
      .filter((f) => f.startsWith("Live intel:"));
    if (liveIntel.length) {
      result = {
        ...result,
        reasons: [...liveIntel.slice(0, 2), ...result.reasons].slice(0, 10),
      };
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Email analysis failed" },
      { status: 400 },
    );
  }
}
