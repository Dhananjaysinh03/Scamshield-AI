import type { AudioReadoutRequest, AudioReadoutResponse } from "./types";

/**
 * ElevenLabs TTS when ELEVENLABS_API_KEY is set; otherwise stub (never 500).
 */
export async function synthesizeReadout(
  req: AudioReadoutRequest,
): Promise<AudioReadoutResponse> {
  const text = (req.text || "").trim().slice(0, 500);
  if (!text) {
    return { mode: "stub", message: "No text provided for readout." };
  }

  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  if (!key) {
    return {
      mode: "stub",
      message: `[Audio Stub]: Would speak - "${text.slice(0, 120)}${text.length > 120 ? "..." : ""}"`,
    };
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
        }),
      },
    );

    if (!res.ok) {
      return {
        mode: "stub",
        message: `[Audio Stub]: ElevenLabs error ${res.status} — falling back.`,
      };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    return {
      mode: "live",
      audioBase64: buf.toString("base64"),
      mime: "audio/mpeg",
    };
  } catch {
    return {
      mode: "stub",
      message: "[Audio Stub]: TTS request failed — falling back.",
    };
  }
}
