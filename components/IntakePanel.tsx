"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/lib/types";

type Props = {
  onAdd: (items: EvidenceItem[]) => void;
  onScan: () => void;
  scanning: boolean;
  disabled?: boolean;
};

function newId() {
  return crypto.randomUUID();
}

export function IntakePanel({ onAdd, onScan, scanning, disabled }: Props) {
  const [text, setText] = useState("");

  function addTextDrop() {
    const content = text.trim();
    if (!content) return;
    onAdd([
      {
        id: newId(),
        type: "text",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText("");
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const items: EvidenceItem[] = [];
    for (const file of Array.from(files)) {
      let content = `[file] ${file.name} (${file.type || "unknown"}, ${file.size} bytes)`;
      if (
        file.type.startsWith("text/") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".md")
      ) {
        try {
          content = await file.text();
        } catch {
          /* keep metadata label */
        }
      }
      items.push({
        id: newId(),
        type: "file",
        content,
        filename: file.name,
        createdAt: new Date().toISOString(),
      });
    }
    onAdd(items);
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground">
          Paste SMS / WhatsApp / email
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="URGENT: Your KYC is incomplete. Verify at https://secure-paypa1-login.xyz/otp …"
          className="w-full resize-y rounded-lg border border-border bg-console px-3 py-3 text-sm text-foreground placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
          disabled={disabled || scanning}
        />
      </label>

      <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-panel/40 px-4 py-3 text-sm text-muted transition hover:border-accent/50 hover:text-foreground focus-within:ring-2 focus-within:ring-accent/30">
        <span>Upload screenshots / txt / pdf</span>
        <input
          type="file"
          multiple
          accept=".txt,.md,.csv,.png,.jpg,.jpeg,.webp,.pdf,text/plain,image/*"
          className="sr-only"
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={disabled || scanning}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={addTextDrop}
          disabled={disabled || scanning || !text.trim()}
          className="min-h-11 flex-1 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
        >
          Add drop
        </button>
        <button
          type="button"
          onClick={onScan}
          disabled={disabled || scanning}
          className="min-h-11 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-zinc-950 transition hover:bg-accent-dim hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40"
        >
          {scanning ? "Scanning…" : "Scan now"}
        </button>
      </div>
    </div>
  );
}
