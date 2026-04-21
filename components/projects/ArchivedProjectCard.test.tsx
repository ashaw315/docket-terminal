import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ProjectWithCount } from '@/types'
import { ArchivedProjectCard } from './ArchivedProjectCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = vi.fn() as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

function makeProject(overrides: Partial<ProjectWithCount> = {}): ProjectWithCount {
  return {
    id: 'p1',
    name: 'Old Project',
    description: null,
    status: 'ARCHIVED',
    color: '#4a9eff',
    position: 'a0',
    createdAt: new Date('2026-01-10T10:00:00Z'),
    updatedAt: new Date('2026-03-15T10:00:00Z'),
    _count: { cards: 4 },
    ...overrides,
  }
}

describe('ArchivedProjectCard', () => {
  it('renders the project name', () => {
    render(<ArchivedProjectCard project={makeProject({ name: 'Ghost Docket' })} onRestored={() => {}} />)
    expect(screen.getByText(/GHOST DOCKET/i)).toBeInTheDocument()
  })

  it('renders the COMPLETED badge when status is COMPLETED', () => {
    render(<ArchivedProjectCard project={makeProject({ status: 'COMPLETED' })} onRestored={() => {}} />)
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })

  it('renders the ARCHIVED badge when status is ARCHIVED', () => {
    render(<ArchivedProjectCard project={makeProject({ status: 'ARCHIVED' })} onRestored={() => {}} />)
    expect(screen.getByText('ARCHIVED')).toBeInTheDocument()
  })

  it('renders the card count as "N CARDS"', () => {
    render(<ArchivedProjectCard project={makeProject({ _count: { cards: 4 } })} onRestored={() => {}} />)
    expect(screen.getByText('4 CARDS')).toBeInTheDocument()
  })

  it('renders the restore button', () => {
    render(<ArchivedProjectCard project={makeProject()} onRestored={() => {}} />)
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument()
  })

  it('restore button calls PATCH /api/projects/[id] with { status: "ACTIVE" }', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'p1', status: 'ACTIVE' } }),
    })
    const onRestored = vi.fn()
    render(<ArchivedProjectCard project={makeProject()} onRestored={onRestored} />)

    fireEvent.click(screen.getByRole('button', { name: /restore/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/projects/p1',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body).toEqual({ status: 'ACTIVE' })
    expect(onRestored).toHaveBeenCalledWith('p1')
  })

  it('shows an error state when the restore API call fails', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Restore failed' }),
    })
    render(<ArchivedProjectCard project={makeProject()} onRestored={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /restore/i }))

    expect(await screen.findByText(/restore failed|error/i)).toBeInTheDocument()
  })
})
