import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <main className="page-enter mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-7 sm:px-8 sm:py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Neural Nexus · Cursor Hackathon
        </p>
        <p className="mt-2 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          ScamShield AI
        </p>
        <h1 className="mt-3 max-w-xl text-base font-medium leading-snug text-foreground/90 sm:text-2xl">
          Offensive cyber-defense — not a ChatGPT wrapper.
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          Exa forensics. Attack timelines. Reverse-poison honeypots.
        </p>

        <div className="mt-7 min-w-0 sm:mt-10">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
