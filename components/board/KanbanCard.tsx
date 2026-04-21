'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '@/types'

type Props = {
  card: Card
  projectColor: string
  onOpen: (card: Card) => void
}

export function KanbanCard({ card, projectColor, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { column: card.column },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const notesFirstLine = card.notes?.split('\n')[0].trim()

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) onOpen(card)
      }}
      className="group relative flex cursor-pointer border border-zinc-800 bg-zinc-900 transition-colors duration-150 hover:bg-zinc-800"
    >
      <div
        data-testid="kanban-card-accent"
        className="w-[2px] shrink-0"
        style={{ backgroundColor: projectColor }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 break-words font-mono text-sm text-zinc-100">
            {card.title}
          </h3>
          <span
            aria-hidden
            className="shrink-0 select-none font-mono text-xs text-zinc-700 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          >
            ⠿
          </span>
        </div>

        {card.url ? (
          <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-600">
            ↗ LINK
          </span>
        ) : null}

        {notesFirstLine ? (
          <p
            data-testid="card-notes-preview"
            className="truncate font-mono text-xs text-zinc-500"
          >
            {notesFirstLine}
          </p>
        ) : null}
      </div>
    </article>
  )
}
