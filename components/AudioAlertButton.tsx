"use client";

import { useRef, useState } from "react";
import { USE_AUDIO_MOCKS } from "@/lib/mocks/config";
import type { AudioReadoutResponse } from "@/lib/types";

type Props = {
  summary: string | null;
  onConsoleLine?: (line: string) => void;
};

export function AudioAlertButton({ summary, onConsoleLine }: Props) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function playAlert() {
    if (!summary?.trim()) {
      const msg = "[Audio]: No scan summary — run a scan first.";
      setToast(msg);
      onConsoleLine?.(msg);
      return;
    }

    setBusy(true);
    setToast(null);

    try {
      if (USE_AUDIO_MOCKS) {
        const msg =
          "[Audio]: Stub mode — voice readout queued (backend TTS offline).";
        setToast(msg);
        onConsoleLine?.(msg);
        return;
      }

      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summary }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as AudioReadoutResponse;

      if (data.mode === "stub") {
        setToast(`[Audio]: ${data.message}`);
        onConsoleLine?.(`[Audio]: ${data.message}`);
        return;
      }

      const src = `data:${data.mime};base64,${data.audioBase64}`;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(src);
      audioRef.current = audio;
      await audio.play();
      onConsoleLine?.("[Audio]: Live readout playing.");
    } catch (err) {
      const msg =
        err instanceof Error
          ? `[Audio]: ${err.message} — stub fallback.`
          : "[Audio]: Request failed — stub fallback.";
      setToast(msg);
      onConsoleLine?.(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void playAlert()}
        disabled={busy}
        className="min-h-11 w-full rounded-lg border border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:opacity-40 sm:w-auto sm:self-start"
      >
        {busy ? "Playing…" : "Audio alert"}
      </button>
      {toast ? (
        <p className="font-mono text-xs text-muted" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
