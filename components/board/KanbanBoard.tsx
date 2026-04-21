'use client'

import { useCallback, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { generateKeyBetween } from 'fractional-indexing'
import type { BoardState, Card, CardColumn, Project } from '@/types'
import { KanbanColumn } from './KanbanColumn'
import { CardDetailModal } from './CardDetailModal'

type Props = {
  project: Project
  initialBoard: BoardState
}

const ALL_COLUMNS: CardColumn[] = ['TODO', 'IN_PROGRESS', 'DONE']

function isColumnId(id: unknown): id is CardColumn {
  return id === 'TODO' || id === 'IN_PROGRESS' || id === 'DONE'
}

function findCardColumn(board: BoardState, id: string): CardColumn | null {
  for (const col of ALL_COLUMNS) {
    if (board[col].some((c) => c.id === id)) return col
  }
  return null
}

export function KanbanBoard({ project, initialBoard }: Props) {
  const [board, setBoard] = useState<BoardState>(initialBoard)
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [boardError, setBoardError] = useState<string | null>(null)
  const snapshotRef = useRef<BoardState | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleCardCreated = useCallback((col: CardColumn) => (card: Card) => {
    setBoard((prev) => ({ ...prev, [col]: [...prev[col], card] }))
  }, [])

  const handleCardOpen = useCallback((card: Card) => setDetailCard(card), [])

  const handleCardUpdated = useCallback((updated: Card) => {
    setBoard((prev) => {
      const next: BoardState = { TODO: [], IN_PROGRESS: [], DONE: [] }
      for (const col of ALL_COLUMNS) {
        next[col] = prev[col].map((c) => (c.id === updated.id ? updated : c))
      }
      return next
    })
  }, [])

  const handleCardDeleted = useCallback((id: string) => {
    setBoard((prev) => {
      const next: BoardState = { TODO: [], IN_PROGRESS: [], DONE: [] }
      for (const col of ALL_COLUMNS) {
        next[col] = prev[col].filter((c) => c.id !== id)
      }
      return next
    })
  }, [])

  function onDragStart(_event: DragStartEvent) {
    snapshotRef.current = board
    setBoardError(null)
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const sourceCol = findCardColumn(board, activeId)
    if (!sourceCol) return

    const targetCol: CardColumn = isColumnId(overId)
      ? overId
      : (findCardColumn(board, overId) ?? sourceCol)

    const sourceIndex = board[sourceCol].findIndex((c) => c.id === activeId)
    const activeCard = board[sourceCol][sourceIndex]

    const sourceAfterRemove = board[sourceCol].filter((c) => c.id !== activeId)
    const targetBefore = targetCol === sourceCol ? sourceAfterRemove : board[targetCol]

    let targetIndex: number
    if (isColumnId(overId)) {
      targetIndex = targetBefore.length
    } else {
      const idx = targetBefore.findIndex((c) => c.id === overId)
      targetIndex = idx === -1 ? targetBefore.length : idx
    }

    if (targetCol === sourceCol && targetIndex === sourceIndex) {
      return
    }

    const before = targetIndex > 0 ? targetBefore[targetIndex - 1] : null
    const after = targetIndex < targetBefore.length ? targetBefore[targetIndex] : null

    let newPosition: string
    try {
      newPosition = generateKeyBetween(before?.position ?? null, after?.position ?? null)
    } catch {
      setBoardError('Could not compute position')
      return
    }

    const movedCard: Card = { ...activeCard, column: targetCol, position: newPosition }
    const nextTarget = [...targetBefore]
    nextTarget.splice(targetIndex, 0, movedCard)

    const nextBoard: BoardState =
      targetCol === sourceCol
        ? { ...board, [sourceCol]: nextTarget }
        : { ...board, [sourceCol]: sourceAfterRemove, [targetCol]: nextTarget }

    setBoard(nextBoard)

    try {
      const res = await fetch(`/api/cards/${activeCard.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ column: targetCol, position: newPosition }),
      })
      if (!res.ok) throw new Error('patch failed')
    } catch {
      if (snapshotRef.current) setBoard(snapshotRef.current)
      setBoardError('Could not save card move')
    }
  }

  return (
    <div className="flex flex-col">
      <div
        className="h-[2px] w-full"
        style={{ backgroundColor: project.color ?? '#3f3f46' }}
      />

      <header className="mb-4 flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <a
            href="/"
            aria-label="Back to projects"
            className="font-mono text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-150"
          >
            ←
          </a>
          <h1 className="font-mono text-sm uppercase tracking-tight text-zinc-100">
            {project.name.toUpperCase()}
          </h1>
        </div>
        {boardError && (
          <span className="font-mono text-xs text-red-400">{boardError}</span>
        )}
      </header>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {ALL_COLUMNS.map((col) => (
            <KanbanColumn
              key={col}
              column={col}
              cards={board[col]}
              projectId={project.id}
              projectColor={project.color ?? '#3f3f46'}
              onCardCreated={handleCardCreated(col)}
              onCardOpen={handleCardOpen}
            />
          ))}
        </div>
      </DndContext>

      <CardDetailModal
        card={detailCard}
        open={detailCard !== null}
        onClose={() => setDetailCard(null)}
        onUpdated={handleCardUpdated}
        onDeleted={handleCardDeleted}
      />
    </div>
  )
}
