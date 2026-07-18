"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/lib/types";

type Props = {
  onAdd: (items: EvidenceItem[]) => void;
  onScan: (extra?: EvidenceItem[]) => void;
  scanning: boolean;
  disabled?: boolean;
  hasEvidence?: boolean;
};

function newId() {
  return crypto.randomUUID();
}

export function IntakePanel({
  onAdd,
  onScan,
  scanning,
  disabled,
  hasEvidence,
}: Props) {
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

  function checkNow() {
    const content = text.trim();
    if (content) {
      const item: EvidenceItem = {
        id: newId(),
        type: "text",
        content,
        createdAt: new Date().toISOString(),
      };
      onAdd([item]);
      setText("");
      onScan([item]);
      return;
    }
    onScan();
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

  const canCheck = Boolean(text.trim() || hasEvidence);

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-2 block text-base font-medium text-foreground">
          Paste the message
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Example: “URGENT — Your account will be blocked. Click this link to verify…”"
          className="w-full resize-y rounded-xl border border-border bg-panel-soft px-4 py-3.5 text-base leading-relaxed text-foreground placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          disabled={disabled || scanning}
        />
      </label>

      <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-panel-soft/60 px-4 py-3 text-sm text-muted transition hover:border-accent/50 hover:text-foreground focus-within:ring-2 focus-within:ring-accent/30">
        <span>Or upload a screenshot / text file</span>
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
        {text.trim() ? (
          <button
            type="button"
            onClick={addTextDrop}
            disabled={disabled || scanning}
            className="min-h-12 flex-1 rounded-xl border border-border bg-panel px-4 text-base font-medium text-foreground transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          >
            Save &amp; add another
          </button>
        ) : null}
        <button
          type="button"
          onClick={checkNow}
          disabled={disabled || scanning || !canCheck}
          className="min-h-12 flex-[1.4] rounded-xl bg-accent px-5 text-base font-semibold text-white transition hover:bg-accent-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 dark:text-zinc-950"
        >
          {scanning ? "Checking…" : "Check if it’s a scam"}
        </button>
      </div>
    </div>
  );
}
