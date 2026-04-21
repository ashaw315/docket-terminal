import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import type { Card } from '@/types'
import { ExpandCardModal } from './ExpandCardModal'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    title: 'Build auth gate',
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

const boardContext = { TODO: [], IN_PROGRESS: [], DONE: [] }

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ExpandCardModal', () => {
  it('shows a loading state while fetching suggestions', async () => {
    let resolveFetch: (v: string[]) => void = () => {}
    const fetchSuggestions = vi.fn(
      () => new Promise<string[]>((res) => { resolveFetch = res })
    )

    render(
      <ExpandCardModal
        card={makeCard()}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={vi.fn().mockResolvedValue(undefined)}
        onClose={() => {}}
      />
    )

    expect(screen.getByText(/THINKING/i)).toBeInTheDocument()

    await act(async () => {
      resolveFetch(['A'])
    })
  })

  it('shows suggestions as checked checkboxes after load', async () => {
    const fetchSuggestions = vi.fn().mockResolvedValue(['One', 'Two', 'Three'])

    render(
      <ExpandCardModal
        card={makeCard()}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={vi.fn().mockResolvedValue(undefined)}
        onClose={() => {}}
      />
    )

    expect(await screen.findByLabelText('One')).toBeChecked()
    expect(screen.getByLabelText('Two')).toBeChecked()
    expect(screen.getByLabelText('Three')).toBeChecked()
  })

  it('disables ADD SELECTED when no suggestions are checked', async () => {
    const fetchSuggestions = vi.fn().mockResolvedValue(['One', 'Two'])

    render(
      <ExpandCardModal
        card={makeCard()}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={vi.fn().mockResolvedValue(undefined)}
        onClose={() => {}}
      />
    )

    const one = await screen.findByLabelText('One')
    const two = screen.getByLabelText('Two')
    fireEvent.click(one)
    fireEvent.click(two)

    expect(screen.getByRole('button', { name: /add selected/i })).toBeDisabled()
  })

  it('enables ADD SELECTED when at least one is checked', async () => {
    const fetchSuggestions = vi.fn().mockResolvedValue(['Only'])

    render(
      <ExpandCardModal
        card={makeCard()}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={vi.fn().mockResolvedValue(undefined)}
        onClose={() => {}}
      />
    )

    await screen.findByLabelText('Only')
    expect(screen.getByRole('button', { name: /add selected/i })).toBeEnabled()
  })

  it('unchecking all suggestions disables the button', async () => {
    const fetchSuggestions = vi.fn().mockResolvedValue(['A', 'B'])

    render(
      <ExpandCardModal
        card={makeCard()}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={vi.fn().mockResolvedValue(undefined)}
        onClose={() => {}}
      />
    )

    const a = await screen.findByLabelText('A')
    const b = screen.getByLabelText('B')
    expect(screen.getByRole('button', { name: /add selected/i })).toBeEnabled()
    fireEvent.click(a)
    fireEvent.click(b)
    expect(screen.getByRole('button', { name: /add selected/i })).toBeDisabled()
  })

  it('calls onAdd with only the checked suggestion titles', async () => {
    const fetchSuggestions = vi.fn().mockResolvedValue(['A', 'B', 'C'])
    const onAdd = vi.fn().mockResolvedValue(undefined)

    render(
      <ExpandCardModal
        card={makeCard({ column: 'IN_PROGRESS' })}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={onAdd}
        onClose={() => {}}
      />
    )

    await screen.findByLabelText('A')
    fireEvent.click(screen.getByLabelText('B'))
    fireEvent.click(screen.getByRole('button', { name: /add selected/i }))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledTimes(1)
    })
    expect(onAdd).toHaveBeenCalledWith(['A', 'C'], 'IN_PROGRESS')
  })

  it('shows an error state when fetch fails', async () => {
    const fetchSuggestions = vi.fn().mockRejectedValue(new Error('nope'))

    render(
      <ExpandCardModal
        card={makeCard()}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={vi.fn().mockResolvedValue(undefined)}
        onClose={() => {}}
      />
    )

    expect(await screen.findByText(/COULD NOT EXPAND/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('retry button re-fetches suggestions on error', async () => {
    const fetchSuggestions = vi
      .fn()
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce(['Recovered'])

    render(
      <ExpandCardModal
        card={makeCard()}
        projectName="Docket"
        boardContext={boardContext}
        fetchSuggestions={fetchSuggestions}
        onAdd={vi.fn().mockResolvedValue(undefined)}
        onClose={() => {}}
      />
    )

    await screen.findByText(/COULD NOT EXPAND/i)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(await screen.findByLabelText('Recovered')).toBeInTheDocument()
    expect(fetchSuggestions).toHaveBeenCalledTimes(2)
  })
})
