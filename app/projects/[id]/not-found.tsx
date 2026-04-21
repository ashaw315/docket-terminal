import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
          DOCKET TERMINAL
        </span>
        <span className="font-mono text-sm uppercase text-zinc-400">
          PROJECT NOT FOUND
        </span>
        <Link
          href="/"
          className="mt-2 font-mono text-xs uppercase text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-zinc-300 hover:decoration-zinc-500 transition-colors duration-150"
        >
          ← Back to projects
        </Link>
      </div>
    </main>
  )
}
