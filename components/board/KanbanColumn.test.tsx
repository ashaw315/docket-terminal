import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Card, CardColumn } from '@/types'
import { KanbanColumn } from './KanbanColumn'

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: 'vertical-list',
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    title: 'T',
    notes: null,
    url: null,
    column: 'TODO',
    position: 'a0',
    projectId: 'p1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

const projectColor = '#4a9eff'

describe('KanbanColumn', () => {
  it.each<[CardColumn, string]>([
    ['TODO', 'TODO'],
    ['IN_PROGRESS', 'IN PROGRESS'],
    ['DONE', 'DONE'],
  ])('renders %s column label as "%s"', (column, label) => {
    render(
      <KanbanColumn
        column={column}
        cards={[]}
        projectId="p1"
        projectColor={projectColor}
        onCardCreated={() => {}}
        onCardOpen={() => {}}
      />
    )
    expect(screen.getByRole('heading', { name: label })).toBeInTheDocument()
  })

  it('renders the correct card count in the header', () => {
    const cards = [
      makeCard({ id: 'a', title: 'A' }),
      makeCard({ id: 'b', title: 'B' }),
      makeCard({ id: 'c', title: 'C' }),
    ]
    render(
      <KanbanColumn
        column="TODO"
        cards={cards}
        projectId="p1"
        projectColor={projectColor}
        onCardCreated={() => {}}
        onCardOpen={() => {}}
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders all cards passed to it', () => {
    const cards = [
      makeCard({ id: 'a', title: 'Alpha' }),
      makeCard({ id: 'b', title: 'Beta' }),
    ]
    render(
      <KanbanColumn
        column="TODO"
        cards={cards}
        projectId="p1"
        projectColor={projectColor}
        onCardCreated={() => {}}
        onCardOpen={() => {}}
      />
    )
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('renders the inline "add card" creator', () => {
    render(
      <KanbanColumn
        column="TODO"
        cards={[]}
        projectId="p1"
        projectColor={projectColor}
        onCardCreated={() => {}}
        onCardOpen={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument()
  })
})
