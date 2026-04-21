'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import type { Card } from '@/types'

type Props = {
  card: Card | null
  open: boolean
  onClose: () => void
  onUpdated: (card: Card) => void
  onDeleted: (id: string) => void
}

function isValidUrl(s: string): boolean {
  if (s === '') return true
  try {
    new URL(s)
    return true
  } catch {
    return false
  }
}

export function CardDetailModal({ card, open, onClose, onUpdated, onDeleted }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && card) {
      setTitle(card.title)
      setNotes(card.notes ?? '')
      setUrl(card.url ?? '')
      setError(null)
      setSubmitting(false)
    }
  }, [open, card])

  if (!card) return null

  async function save() {
    if (!card) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Title is required')
      return
    }
    if (!isValidUrl(url.trim())) {
      setError('URL must be empty or a valid URL')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        title: trimmedTitle,
        notes: notes,
        url: url.trim(),
      }
      const res = await fetch(`/api/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        setError(typeof data.error === 'string' ? data.error : 'Request failed')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      onUpdated(data.data as Card)
      router.refresh()
      onClose()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  async function remove() {
    if (!card) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Delete failed' }))
        setError(typeof data.error === 'string' ? data.error : 'Delete failed')
        setSubmitting(false)
        return
      }
      onDeleted(card.id)
      router.refresh()
      onClose()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="card-detail-title">
      <h2
        id="card-detail-title"
        className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500"
      >
        CARD
      </h2>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase text-zinc-500">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            className="border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase text-zinc-500">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="resize-none border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-100 focus:border-zinc-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase text-zinc-500">URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-100 focus:border-zinc-500 focus:outline-none"
          />
        </label>

        {error && (
          <div className="font-mono text-xs text-red-400">{error}</div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={remove}
            disabled={submitting}
            className="border border-red-800 px-3 py-1 font-mono text-xs uppercase text-red-400 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-40"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-zinc-800 px-3 py-1 font-mono text-xs uppercase text-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={submitting || !title.trim()}
              className="border border-zinc-600 px-3 py-1 font-mono text-xs uppercase text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
