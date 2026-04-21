import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ProjectWithCount } from '@/types'
import { ArchivedProjectList } from './ArchivedProjectList'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

function makeProject(overrides: Partial<ProjectWithCount> = {}): ProjectWithCount {
  return {
    id: 'p1',
    name: 'A',
    description: null,
    status: 'ARCHIVED',
    color: null,
    position: 'a0',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { cards: 0 },
    ...overrides,
  }
}

describe('ArchivedProjectList', () => {
  it('renders the NO ARCHIVED PROJECTS empty state when the list is empty', () => {
    render(<ArchivedProjectList projects={[]} />)
    expect(screen.getByText('NO ARCHIVED PROJECTS')).toBeInTheDocument()
  })

  it('renders the projects and not the empty state when the list is non-empty', () => {
    const projects = [makeProject({ id: 'p1', name: 'One' })]
    render(<ArchivedProjectList projects={projects} />)
    expect(screen.getByText(/ONE/)).toBeInTheDocument()
    expect(screen.queryByText('NO ARCHIVED PROJECTS')).not.toBeInTheDocument()
  })
})
