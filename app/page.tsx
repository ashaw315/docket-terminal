import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import type { ProjectWithCount } from '@/types'
import { ProjectGrid } from '@/components/projects/ProjectGrid'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const projects: ProjectWithCount[] = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { position: 'asc' },
    include: { _count: { select: { cards: true } } },
  })

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 bg-zinc-950 text-zinc-100">
      <header className="mb-10 flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          DOCKET TERMINAL
        </h1>
        <div className="flex items-baseline gap-4">
          <Link
            href="/archive"
            className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
          >
            ARCHIVE →
          </Link>
          <a
            href="/api/auth/logout"
            className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
          >
            LOGOUT →
          </a>
        </div>
      </header>

      <ProjectGrid projects={projects} />
    </main>
  )
}
