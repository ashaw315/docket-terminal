'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

const PRESET_COLORS = [
  '#4a9eff',
  '#f97316',
  '#22c55e',
  '#a855f7',
  '#ef4444',
  '#eab308',
] as const

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

type Props = {
  open: boolean
  onClose: () => void
}

export function ProjectCreateModal({ open, onClose }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>('')
  const [hexInput, setHexInput] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setColor('')
      setHexInput('')
      setError(null)
      setSubmitting(false)
    }
  }, [open])

  function chooseHex(value: string) {
    setHexInput(value)
    if (HEX_RE.test(value.trim())) {
      setColor(value.trim())
    }
  }

  const trimmedName = name.trim()
  const canSubmit = trimmedName.length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { name: trimmedName }
      if (description.trim()) body.description = description.trim()
      if (color) body.color = color

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        setError(typeof data.error === 'string' ? data.error : 'Request failed')
        setSubmitting(false)
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="create-project-title">
      <h2
        id="create-project-title"
        className="mb-4 font-mono text-sm uppercase tracking-tight text-zinc-400"
      >
        NEW PROJECT
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase text-zinc-500">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            className="border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase text-zinc-500">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase text-zinc-500">Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select color ${c}`}
                onClick={() => {
                  setColor(c)
                  setHexInput('')
                }}
                className={
                  'h-6 w-6 border transition-colors duration-150 ' +
                  (color === c ? 'border-zinc-100' : 'border-zinc-800 hover:border-zinc-600')
                }
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              aria-label="Custom hex color"
              placeholder="#rrggbb"
              value={hexInput}
              onChange={(e) => chooseHex(e.target.value)}
              className="w-24 border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-100 focus:border-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="font-mono text-xs text-red-400">{error}</div>
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
            type="submit"
            disabled={!canSubmit}
            className="border border-zinc-600 px-3 py-1 font-mono text-xs uppercase text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  )
}
