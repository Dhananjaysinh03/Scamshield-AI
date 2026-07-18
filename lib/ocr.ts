import type { OcrResponse } from "@/lib/types";

/**
 * Extract text from a screenshot/image.
 * Uses OpenAI vision when OPENAI_API_KEY is set; otherwise stub (FE can still paste).
 */
export async function extractTextFromImage(
  base64: string,
  mime = "image/png",
): Promise<OcrResponse> {
  const key = process.env.OPENAI_API_KEY;
  const cleaned = base64.replace(/^data:[^;]+;base64,/, "");

  if (!key) {
    return {
      mode: "stub",
      text: "",
      message:
        "OCR needs OPENAI_API_KEY for screenshots. Paste the message text, or add the key for auto-read.",
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL readable text from this screenshot of a scam/SMS/WhatsApp/email. Include URLs exactly. Output plain text only.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime};base64,${cleaned}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        mode: "stub",
        text: "",
        message: `OCR failed (${res.status}). Paste the text instead.`,
      };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    return {
      mode: "live",
      text,
      message: text ? undefined : "No text detected in image.",
    };
  } catch {
    return {
      mode: "stub",
      text: "",
      message: "OCR request failed. Paste the message text.",
    };
  }
}
