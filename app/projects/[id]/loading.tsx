export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="h-[2px] w-full bg-zinc-800" />

      <header className="mb-4 flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-zinc-700">←</span>
          <span className="h-4 w-40 bg-zinc-800" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3">
        {['TODO', 'IN PROGRESS', 'DONE'].map((label) => (
          <section key={label} className="flex min-h-[calc(100vh-8rem)] flex-col border-r border-zinc-800">
            <header className="flex items-baseline justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-700">
                {label}
              </h2>
              <span className="font-mono text-xs text-zinc-800">·</span>
            </header>
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex border border-zinc-800 bg-zinc-900">
                  <div className="w-[2px] shrink-0 bg-zinc-800" />
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="h-3 w-3/4 bg-zinc-800" />
                    <div className="h-3 w-1/2 bg-zinc-900" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
