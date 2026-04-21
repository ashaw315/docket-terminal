import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import type { ProjectWithCount } from '@/types'
import { ArchivedProjectList } from '@/components/projects/ArchivedProjectList'

export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
  const projects: ProjectWithCount[] = await prisma.project.findMany({
    where: { status: { in: ['COMPLETED', 'ARCHIVED'] } },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { cards: true } } },
  })

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 bg-zinc-950 text-zinc-100">
      <header className="mb-10 flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          ARCHIVE
        </h1>
        <Link
          href="/"
          className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
        >
          ← ACTIVE
        </Link>
      </header>

      <ArchivedProjectList projects={projects} />
    </main>
  )
}
