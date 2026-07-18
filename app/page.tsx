import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <main className="page-enter mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-8 sm:py-14">
        <p className="font-display text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          ScamShield AI
        </p>
        <h1 className="mt-4 max-w-xl text-lg font-medium leading-snug text-foreground/90 sm:text-2xl">
          Dismantle phishing funnels before they cash out.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          Drop SMS, WhatsApp threats, or fake portals. Live Exa intel. Stitched
          attack timelines. Reverse-poison the scammer&apos;s inbox.
        </p>

        <div className="mt-8 sm:mt-10">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
