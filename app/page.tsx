import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
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

        <div className="mt-10">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
