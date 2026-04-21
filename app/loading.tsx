export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 bg-zinc-950 text-zinc-100">
      <header className="mb-10 flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          DOCKET TERMINAL
        </h1>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase text-zinc-700">GENERATE →</span>
          <span className="font-mono text-xs uppercase text-zinc-700">GUIDE →</span>
          <span className="font-mono text-xs uppercase text-zinc-700">NEW PROJECT</span>
          <span className="font-mono text-xs uppercase text-zinc-700">ARCHIVE →</span>
          <span className="font-mono text-xs uppercase text-zinc-700">LOGOUT →</span>
        </div>
      </header>

      <div className="mb-6 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase text-zinc-700">LOADING…</span>
      </div>

      <div className="grid grid-cols-1 gap-px bg-zinc-800 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex border border-zinc-800 bg-zinc-900"
          >
            <div className="w-[3px] shrink-0 bg-zinc-800" />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="h-4 w-1/2 bg-zinc-800" />
              <div className="h-3 w-3/4 bg-zinc-900" />
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3 w-16 bg-zinc-800" />
                <div className="h-3 w-24 bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
