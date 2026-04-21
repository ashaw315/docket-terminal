import Link from 'next/link'
import { IngestForm } from '@/components/ingest/IngestForm'
import { pushToBoard } from './actions'

export const dynamic = 'force-dynamic'

export default function IngestPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 bg-zinc-950 text-zinc-100 sm:px-6 sm:py-10">
      <header className="mb-8 flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
          >
            ← DOCKET
          </Link>
          <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            PUSH TO BOARD
          </h1>
        </div>
      </header>

      <IngestForm pushToBoard={pushToBoard} />
    </main>
  )
}
