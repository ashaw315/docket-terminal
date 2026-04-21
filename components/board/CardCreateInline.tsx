'use client'

import { useState, useRef, useEffect } from 'react'
import type { Card, CardColumn } from '@/types'

type Props = {
  projectId: string
  column: CardColumn
  onCreated: (card: Card) => void
}

export function CardCreateInline({ projectId, column, onCreated }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  function collapse() {
    setExpanded(false)
    setTitle('')
    setError(null)
  }

  async function submit() {
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/cards`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: trimmed, column }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        setError(typeof data.error === 'string' ? data.error : 'Request failed')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      onCreated(data.data as Card)
      setTitle('')
      setSubmitting(false)
      inputRef.current?.focus()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full border border-dashed border-zinc-800 px-3 py-2 text-left font-mono text-xs uppercase text-zinc-600 hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-400 transition-colors duration-150"
      >
        + Add Card
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            collapse()
          }
        }}
        onBlur={() => {
          if (!title.trim()) collapse()
        }}
        placeholder="Card title…"
        aria-label="New card title"
        maxLength={255}
        className="w-full border border-zinc-700 bg-zinc-950 px-2 py-2 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
      />
      {error && <span className="font-mono text-xs text-red-400">{error}</span>}
    </div>
  )
}
