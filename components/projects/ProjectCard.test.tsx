import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ProjectWithCount } from '@/types'
import { ProjectCard } from './ProjectCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

function makeProject(overrides: Partial<ProjectWithCount> = {}): ProjectWithCount {
  return {
    id: 'p1',
    name: 'Test Project',
    description: null,
    status: 'ACTIVE',
    color: '#4a9eff',
    position: 'a0',
    createdAt: new Date('2026-03-15T10:00:00Z'),
    updatedAt: new Date('2026-03-15T10:00:00Z'),
    _count: { cards: 5 },
    ...overrides,
  }
}

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders project name in uppercase', () => {
    render(<ProjectCard project={makeProject({ name: 'test project' })} />)
    expect(screen.getByText(/TEST PROJECT/i)).toBeInTheDocument()
  })

  it('renders card count as "N CARDS"', () => {
    render(<ProjectCard project={makeProject({ _count: { cards: 7 } })} />)
    expect(screen.getByText('7 CARDS')).toBeInTheDocument()
  })

  it('applies the project color as the left accent border', () => {
    render(<ProjectCard project={makeProject({ color: '#f97316' })} />)
    const accent = screen.getByTestId('project-card-accent')
    expect(accent).toHaveStyle({ backgroundColor: '#f97316' })
  })

  it('does not render description when absent', () => {
    render(<ProjectCard project={makeProject({ description: null })} />)
    expect(screen.queryByTestId('project-card-description')).not.toBeInTheDocument()
  })

  it('renders description when present', () => {
    render(<ProjectCard project={makeProject({ description: 'a short note' })} />)
    expect(screen.getByText('a short note')).toBeInTheDocument()
  })

  it('has a ProjectMenu trigger button in the DOM', () => {
    render(<ProjectCard project={makeProject()} />)
    expect(screen.getByRole('button', { name: /project menu/i })).toBeInTheDocument()
  })
})
