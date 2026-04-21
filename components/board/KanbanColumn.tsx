'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Card, CardColumn } from '@/types'
import { KanbanCard } from './KanbanCard'
import { CardCreateInline } from './CardCreateInline'

type Props = {
  column: CardColumn
  cards: Card[]
  projectId: string
  projectColor: string
  onCardCreated: (card: Card) => void
  onCardOpen: (card: Card) => void
}

const LABELS: Record<CardColumn, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  DONE: 'DONE',
}

export function KanbanColumn({
  column,
  cards,
  projectId,
  projectColor,
  onCardCreated,
  onCardOpen,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column, data: { column } })
  const label = LABELS[column]

  return (
    <section
      ref={setNodeRef}
      className={
        'flex min-h-[calc(100vh-8rem)] flex-col border-r border-zinc-800 ' +
        (isOver ? 'border-zinc-600' : '')
      }
    >
      <header className="flex items-baseline justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
          {label}
        </h2>
        <span className="font-mono text-xs text-zinc-500">{cards.length}</span>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              projectColor={projectColor}
              onOpen={onCardOpen}
            />
          ))}
        </SortableContext>
        <CardCreateInline projectId={projectId} column={column} onCreated={onCardCreated} />
      </div>
    </section>
  )
}
