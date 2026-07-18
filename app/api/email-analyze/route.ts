import { NextResponse } from "next/server";
import { analyzeEmailRaw } from "@/lib/email/analyzeEmail";
import type { EmailAnalysisResult } from "@/lib/email/types";
import {
  lookupSenderReputation,
  recordPhishingSender,
} from "@/lib/email/senderReputation";
import Exa from "exa-js";

export const runtime = "nodejs";
export const maxDuration = 30;

async function enrichUrlsWithExa(result: EmailAnalysisResult): Promise<EmailAnalysisResult> {
  const key = process.env.EXA_API_KEY;
  if (!key || result.technicalFindings.urls.items.length === 0) return result;

  try {
    const exa = new Exa(key);
    const enriched = [...result.technicalFindings.urls.items];

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
      ...result,
      technicalFindings: {
        ...result.technicalFindings,
        urls: { ...result.technicalFindings.urls, items: enriched },
      },
    };
  } catch {
    return result;
  }
}

/**
 * Multi-factor email analyzer + sender reputation.
 * POST { raw: string, officialDomain?: string }
 */
export async function POST(req: Request) {
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

    let result = analyzeEmailRaw(raw, {
      officialDomain: body.officialDomain,
    });
    result = await enrichUrlsWithExa(result);

    const fromEmail = result.technicalFindings.sender.email;
    const fromDomain = result.technicalFindings.sender.domain;

    if (result.verdict === "phishing" || result.preventionLevel === "hard_stop") {
      recordPhishingSender(fromEmail, fromDomain);
    }

    const senderReputation = lookupSenderReputation(fromEmail, fromDomain);
    result = { ...result, senderReputation };

    if (
      senderReputation.plainMessage &&
      !result.reasons.some((r) => r.includes("often") || r.includes("flagged"))
    ) {
      result = {
        ...result,
        reasons: [senderReputation.plainMessage, ...result.reasons].slice(0, 8),
      };
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Email analysis failed" }, { status: 400 });
  }
}
