'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/types'

type Props = {
  project: Pick<Project, 'id' | 'name'>
  onRenameStart?: () => void
}

export function ProjectMenu({ project, onRenameStart }: Props) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function patchStatus(status: 'COMPLETED' | 'ARCHIVED') {
    setError(null)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      setError('Action failed')
      return
    }
    setOpen(false)
    router.refresh()
  }

  async function doDelete() {
    setError(null)
    const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Delete failed')
      return
    }
    setDeleting(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Project menu"
        className="px-2 py-1 font-mono text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
        onClick={() => setOpen((o) => !o)}
      >
        ⋮
      </button>

      {open && !deleting && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 min-w-[12rem] border border-zinc-800 bg-zinc-900 font-mono text-xs"
        >
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 transition-colors duration-150"
            onClick={() => {
              setOpen(false)
              onRenameStart?.()
            }}
          >
            RENAME
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 transition-colors duration-150"
            onClick={() => patchStatus('COMPLETED')}
          >
            MARK COMPLETE
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 transition-colors duration-150"
            onClick={() => patchStatus('ARCHIVED')}
          >
            ARCHIVE
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full border-t border-zinc-800 px-3 py-2 text-left text-red-400 hover:bg-zinc-800 transition-colors duration-150"
            onClick={() => {
              setDeleting(true)
              setConfirmText('')
            }}
          >
            DELETE
          </button>
          {error && (
            <div className="border-t border-zinc-800 px-3 py-2 text-red-400">{error}</div>
          )}
        </div>
      )}

      {deleting && (
        <div
          role="dialog"
          aria-label="Confirm delete"
          className="absolute right-0 top-full z-20 w-72 border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs"
        >
          <div className="mb-2 text-zinc-400">
            TYPE PROJECT NAME TO CONFIRM
          </div>
          <input
            aria-label="Confirm project name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mb-2 block w-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-zinc-100 focus:border-zinc-600 focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="border border-zinc-800 px-2 py-1 text-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
              onClick={() => {
                setDeleting(false)
                setConfirmText('')
              }}
            >
              CANCEL
            </button>
            <button
              type="button"
              disabled={confirmText !== project.name}
              className="border border-red-500 px-2 py-1 text-red-400 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={doDelete}
            >
              DELETE
            </button>
          </div>
          {error && <div className="mt-2 text-red-400">{error}</div>}
        </div>
      )}
    </div>
  )
}
