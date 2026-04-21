export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 bg-zinc-950 text-zinc-100 sm:px-6 sm:py-10">
      <header className="mb-8 flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase text-zinc-700">← DOCKET</span>
          <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            PUSH TO BOARD
          </h1>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <div className="h-4 w-48 bg-zinc-800" />
        <div className="h-[50vh] w-full border border-zinc-800 bg-zinc-900" />
        <div className="h-9 w-24 border border-zinc-800 bg-zinc-900" />
      </div>
    </main>
  )
}
