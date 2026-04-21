'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { BoardState, Card, CardColumn } from '@/types'

export type ExpandCardFetcher = (input: {
  card: Card
  projectName: string
  boardContext: { TODO: string[]; IN_PROGRESS: string[]; DONE: string[] }
}) => Promise<string[]>

type Props = {
  card: Card
  projectName: string
  boardContext: BoardState | { TODO: string[]; IN_PROGRESS: string[]; DONE: string[] }
  fetchSuggestions: ExpandCardFetcher
  onAdd: (titles: string[], column: CardColumn) => Promise<void>
  onClose: () => void
}

type Status = 'loading' | 'ready' | 'error' | 'submitting'

const COLUMN_LABEL: Record<CardColumn, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  DONE: 'DONE',
}

function toTitleContext(
  ctx: Props['boardContext']
): { TODO: string[]; IN_PROGRESS: string[]; DONE: string[] } {
  function toTitles(v: unknown): string[] {
    if (!Array.isArray(v)) return []
    return v.map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'title' in item) {
        const t = (item as { title: unknown }).title
        return typeof t === 'string' ? t : ''
      }
      return ''
    })
  }
  return {
    TODO: toTitles(ctx.TODO),
    IN_PROGRESS: toTitles(ctx.IN_PROGRESS),
    DONE: toTitles(ctx.DONE),
  }
}

export function ExpandCardModal({
  card,
  projectName,
  boardContext,
  fetchSuggestions,
  onAdd,
  onClose,
}: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [targetColumn, setTargetColumn] = useState<CardColumn>(card.column)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setStatus('loading')
    setError(null)
    try {
      const result = await fetchSuggestions({
        card,
        projectName,
        boardContext: toTitleContext(boardContext),
      })
      setSuggestions(result)
      const initial: Record<string, boolean> = {}
      for (const s of result) initial[s] = true
      setChecked(initial)
      setStatus('ready')
    } catch {
      setError('COULD NOT EXPAND — TRY AGAIN')
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
    // Intentionally run only when card.id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  function toggle(title: string) {
    setChecked((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const checkedTitles = suggestions.filter((s) => checked[s])
  const canAdd = checkedTitles.length > 0 && status !== 'submitting'

  async function handleAdd() {
    if (!canAdd) return
    setStatus('submitting')
    setError(null)
    try {
      await onAdd(checkedTitles, targetColumn)
      onClose()
    } catch {
      setError('COULD NOT ADD — TRY AGAIN')
      setStatus('ready')
    }
  }

  return (
    <Modal open={true} onClose={onClose} labelledBy="expand-card-title">
      <h2
        id="expand-card-title"
        className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-400"
      >
        EXPAND CARD
      </h2>
      <div className="mb-4 font-mono text-xs text-zinc-600">
        EXPANDING: {card.title.toUpperCase()}
      </div>

      {status === 'loading' && (
        <div className="font-mono text-xs uppercase text-zinc-500 animate-pulse">
          THINKING…
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs uppercase text-red-400">
            {error ?? 'COULD NOT EXPAND — TRY AGAIN'}
          </span>
          <div>
            <button
              type="button"
              onClick={load}
              className="border border-zinc-700 px-3 py-1 font-mono text-xs uppercase text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {(status === 'ready' || status === 'submitting') && (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <input
                  id={`sugg-${s}`}
                  type="checkbox"
                  aria-label={s}
                  checked={!!checked[s]}
                  onChange={() => toggle(s)}
                  className="mt-[3px] h-3 w-3 accent-zinc-400"
                />
                <label
                  htmlFor={`sugg-${s}`}
                  className="min-w-0 break-words font-mono text-sm uppercase tracking-tight text-zinc-100"
                >
                  {s}
                </label>
              </li>
            ))}
          </ul>

          <label className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase text-zinc-500">
              Target column:
            </span>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value as CardColumn)}
              className="border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs uppercase text-zinc-100 focus:border-zinc-500 focus:outline-none"
            >
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((c) => (
                <option key={c} value={c}>
                  {COLUMN_LABEL[c]}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <div className="font-mono text-xs uppercase text-red-400">{error}</div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-zinc-800 px-3 py-1 font-mono text-xs uppercase text-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="border border-zinc-600 px-3 py-1 font-mono text-xs uppercase text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Add Selected
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
