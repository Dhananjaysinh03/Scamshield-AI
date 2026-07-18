import { NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/ocr";
import type { OcrResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST { imageBase64: string, mime?: string }
 * Returns extracted text for screenshot scam checks.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mime?: string;
    };
    if (!body.imageBase64) {
      return NextResponse.json(
        {
          mode: "stub",
          text: "",
          message: "Missing imageBase64",
        } satisfies OcrResponse,
        { status: 400 },
      );
    }

    const result = await extractTextFromImage(
      body.imageBase64,
      body.mime || "image/png",
    );
    return NextResponse.json(result satisfies OcrResponse);
  } catch {
    return NextResponse.json(
      {
        mode: "stub",
        text: "",
        message: "OCR failed",
      } satisfies OcrResponse,
      { status: 200 },
    );
  }
}
