import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { BoardState, Card } from '@/types'
import { KanbanBoard } from '@/components/board/KanbanBoard'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

function bucketCards(cards: Card[]): BoardState {
  const buckets: BoardState = { TODO: [], IN_PROGRESS: [], DONE: [] }
  for (const c of cards) buckets[c.column].push(c)
  for (const col of Object.keys(buckets) as Array<keyof BoardState>) {
    buckets[col].sort((a, b) => (a.position < b.position ? -1 : a.position > b.position ? 1 : 0))
  }
  return buckets
}

export default async function ProjectBoardPage({ params }: Props) {
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      cards: { orderBy: [{ column: 'asc' }, { position: 'asc' }] },
    },
  })

  if (!project) notFound()

  const initialBoard = bucketCards(project.cards)
  const { cards: _cards, ...projectOnly } = project

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <KanbanBoard project={projectOnly} initialBoard={initialBoard} />
    </main>
  )
}
