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
      <header className="mb-10 border-b border-zinc-800 pb-4">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          DOCKET TERMINAL
        </h1>
      </header>

      <ProjectGrid projects={projects} />
    </main>
  )
}
