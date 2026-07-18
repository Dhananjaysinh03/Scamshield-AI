import { Dashboard } from "@/components/Dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <header
        className="sticky top-0 z-30 border-b border-border/80 backdrop-blur-md"
        style={{ background: "var(--header-bg)" }}
      >
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white dark:text-zinc-950"
              aria-hidden
            >
              S
            </span>
            <p className="font-display truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              ScamShield
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="page-enter flex w-full flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-4xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <p className="font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Got a suspicious message?
          </p>
          <h1 className="mt-3 text-lg leading-relaxed text-foreground/85 sm:text-xl">
            Paste it here. We&apos;ll tell you if it looks like a scam — in
            simple words.
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Built for everyday people. No tech skills needed.
          </p>
        </div>

        <div className="mt-8 min-w-0 w-full sm:mt-10">
          <Dashboard />
        </div>
      </main>
    </div>
  );
}
