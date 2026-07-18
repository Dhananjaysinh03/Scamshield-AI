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
      const msg = "Check a message first to hear the warning.";
      setToast(msg);
      onConsoleLine?.(`[Audio]: ${msg}`);
      return;
    }

    setBusy(true);
    setToast(null);

    try {
      if (USE_AUDIO_MOCKS) {
        const msg = "Voice warning isn’t available right now — read the result above.";
        setToast(msg);
        onConsoleLine?.(`[Audio]: stub`);
        return;
      }

      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summary }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as AudioReadoutResponse;

      if (data.mode === "stub") {
        setToast(data.message || "Voice warning isn’t available right now.");
        onConsoleLine?.(`[Audio]: ${data.message}`);
        return;
      }

      const src = `data:${data.mime};base64,${data.audioBase64}`;
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(src);
      audioRef.current = audio;
      await audio.play();
      onConsoleLine?.("[Audio]: Live readout playing.");
    } catch {
      setToast("Couldn’t play audio. Please read the written result instead.");
      onConsoleLine?.("[Audio]: failed");
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
        className="min-h-12 w-full rounded-xl border border-border bg-panel px-4 text-base font-semibold text-foreground transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 sm:w-auto sm:self-start"
      >
        {busy ? "Playing…" : "Hear the warning"}
      </button>
      {toast ? (
        <p className="text-sm text-muted" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
