export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10 bg-zinc-950 text-zinc-100">
      <header className="mb-10 flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase text-zinc-700">← DOCKET</span>
          <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
            CLAUDE INTEGRATION GUIDE
          </h1>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i} className="flex flex-col gap-3">
            <div className="h-4 w-56 bg-zinc-800" />
            <div className="h-3 w-full bg-zinc-900" />
            <div className="h-3 w-4/5 bg-zinc-900" />
            <div className="h-3 w-2/3 bg-zinc-900" />
            <div className="h-24 w-full border border-zinc-800 bg-zinc-900" />
          </section>
        ))}
      </div>
    </main>
  )
}
