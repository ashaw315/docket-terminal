'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectWithCount } from '@/types'

type Props = {
  project: ProjectWithCount
  onRestored: (id: string) => void
}

function formatClosed(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function ArchivedProjectCard({ project, onRestored }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const accentColor = project.color ?? '#3f3f46'

  async function restore() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Restore failed' }))
        setError(typeof data.error === 'string' ? data.error : 'Restore failed')
        setSubmitting(false)
        return
      }
      onRestored(project.id)
      router.refresh()
    } catch {
      setError('Network error')
      setSubmitting(false)
    }
  }

  return (
    <article className="flex border border-zinc-800 bg-zinc-900">
      <div
        className="w-[3px] shrink-0 opacity-50"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="truncate font-mono text-sm uppercase tracking-tight text-zinc-500">
            {project.name.toUpperCase()}
          </h2>
          <span
            className={
              'shrink-0 font-mono text-xs uppercase ' +
              (project.status === 'COMPLETED' ? 'text-zinc-400' : 'text-zinc-600')
            }
          >
            {project.status}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-600">{project._count.cards} CARDS</span>
          <span className="text-zinc-700">CLOSED {formatClosed(project.updatedAt)}</span>
        </div>

        <div className="mt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={restore}
            disabled={submitting}
            className="border border-zinc-700 px-3 py-1 font-mono text-xs uppercase text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors duration-150 disabled:opacity-40 disabled:hover:border-zinc-700 disabled:hover:text-zinc-400"
          >
            Restore
          </button>
        </div>

        {error && (
          <div className="font-mono text-xs text-red-400">{error}</div>
        )}
      </div>
    </article>
  )
}
