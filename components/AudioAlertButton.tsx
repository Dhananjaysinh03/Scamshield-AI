"use client";

import { useState } from "react";
import type { AudioReadoutResponse } from "@/lib/types";

type Props = {
  text: string | null;
  onConsole?: (line: string) => void;
};

export function AudioAlertButton({ text, onConsole }: Props) {
  const [busy, setBusy] = useState(false);

  async function speak() {
    if (!text?.trim()) {
      onConsole?.("[Audio]: No scan summary to read.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as AudioReadoutResponse;
      if (data.mode === "stub") {
        onConsole?.(data.message);
        return;
      }
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.mime });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      onConsole?.("[Audio]: Live readout playing.");
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      onConsole?.("[Audio]: Playback failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void speak()}
      disabled={busy || !text}
      className="min-h-11 w-full rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground transition hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 sm:w-auto"
    >
      {busy ? "Speaking…" : "Speak security readout"}
    </button>
  );
}
