export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          ScamShield AI
        </p>
        <h1 className="mt-4 max-w-xl text-xl font-medium leading-snug text-foreground/90 sm:text-2xl">
          Dismantle phishing funnels before they cash out.
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">
          Drop SMS, WhatsApp threats, or fake portals. Live Exa intel. Stitched
          attack timelines. Reverse-poison the scammer&apos;s inbox.
        </p>

        <div
          data-testid="intake-region"
          className="mt-10 min-h-[12rem] rounded-lg border border-dashed border-border bg-panel/60 p-5 sm:p-6"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Intake online
          </p>
          <p className="mt-2 text-sm text-muted">
            Evidence paste + scan console wiring in next wave…
          </p>
        </div>
      </main>
    </div>
  );
}
