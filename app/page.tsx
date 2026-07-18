import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <main className="page-enter mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-8 sm:py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Neural Nexus · Cursor Hackathon
        </p>
        <p className="mt-2 font-display text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          ScamShield AI
        </p>
        <h1 className="mt-4 max-w-xl text-lg font-medium leading-snug text-foreground/90 sm:text-2xl">
          Offensive cyber-defense — not a ChatGPT wrapper.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          Live Exa forensics. Stitched multi-stage scam timelines. Reverse-poison
          honeypots that corrupt the attacker&apos;s database in real time.
        </p>

        <div className="mt-8 sm:mt-10">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
