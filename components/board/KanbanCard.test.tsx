import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Card } from '@/types'
import { KanbanCard } from './KanbanCard'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    title: 'Test card',
    notes: null,
    url: null,
    column: 'TODO',
    position: 'a0',
    projectId: 'p1',
    createdAt: new Date('2026-03-15T10:00:00Z'),
    updatedAt: new Date('2026-03-15T10:00:00Z'),
    ...overrides,
  }
}

describe('KanbanCard', () => {
  it('renders the card title', () => {
    render(<KanbanCard card={makeCard({ title: 'Write spec' })} projectColor="#4a9eff" onOpen={() => {}} />)
    expect(screen.getByText('Write spec')).toBeInTheDocument()
  })

  it('renders a LINK badge when url is present', () => {
    render(<KanbanCard card={makeCard({ url: 'https://example.com' })} projectColor="#4a9eff" onOpen={() => {}} />)
    expect(screen.getByText(/LINK/)).toBeInTheDocument()
  })

  it('does not render a LINK badge when url is absent', () => {
    render(<KanbanCard card={makeCard({ url: null })} projectColor="#4a9eff" onOpen={() => {}} />)
    expect(screen.queryByText(/LINK/)).not.toBeInTheDocument()
  })

  it('renders the first line of notes when notes are present', () => {
    render(
      <KanbanCard
        card={makeCard({ notes: 'first line\nsecond line' })}
        projectColor="#4a9eff"
        onOpen={() => {}}
      />
    )
    expect(screen.getByText('first line')).toBeInTheDocument()
    expect(screen.queryByText(/second line/)).not.toBeInTheDocument()
  })

  it('does not render the notes section when notes are absent', () => {
    render(<KanbanCard card={makeCard({ notes: null })} projectColor="#4a9eff" onOpen={() => {}} />)
    expect(screen.queryByTestId('card-notes-preview')).not.toBeInTheDocument()
  })
})
