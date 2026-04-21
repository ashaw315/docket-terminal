'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectWithCount } from '@/types'
import { ProjectMenu } from './ProjectMenu'

type Props = {
  project: ProjectWithCount
}

function formatOpened(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function ProjectCard({ project }: Props) {
  const router = useRouter()
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(project.name)
  const [renameError, setRenameError] = useState<string | null>(null)

  async function commitRename() {
    const next = draftName.trim()
    if (!next || next === project.name) {
      setRenaming(false)
      setDraftName(project.name)
      return
    }
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: next }),
    })
    if (!res.ok) {
      setRenameError('Rename failed')
      return
    }
    setRenaming(false)
    setRenameError(null)
    router.refresh()
  }

  function cancelRename() {
    setRenaming(false)
    setDraftName(project.name)
    setRenameError(null)
  }

  function onCardClick() {
    if (renaming) return
    router.push(`/projects/${project.id}`)
  }

  const accentColor = project.color ?? '#3f3f46'

  return (
    <article
      onClick={onCardClick}
      className="group relative flex cursor-pointer border border-zinc-800 bg-zinc-900 transition-colors duration-150 hover:bg-zinc-800"
    >
      <div
        data-testid="project-card-accent"
        className="w-[3px] shrink-0"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          {renaming ? (
            <input
              aria-label="Rename project"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitRename()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  cancelRename()
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full border border-zinc-700 bg-zinc-950 px-1 py-0.5 font-mono text-sm uppercase tracking-tight text-zinc-100 focus:border-zinc-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <h2 className="truncate font-mono text-sm uppercase tracking-tight text-zinc-100">
              {project.name.toUpperCase()}
            </h2>
          )}

          <div className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
            <ProjectMenu
              project={{ id: project.id, name: project.name }}
              onRenameStart={() => {
                setDraftName(project.name)
                setRenaming(true)
              }}
            />
          </div>
        </div>

        {project.description ? (
          <p
            data-testid="project-card-description"
            className="line-clamp-1 text-xs text-zinc-500"
          >
            {project.description}
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-600">{project._count.cards} CARDS</span>
          <span className="text-zinc-700">OPENED {formatOpened(project.createdAt)}</span>
        </div>

        {renameError && (
          <div className="font-mono text-xs text-red-400">{renameError}</div>
        )}
      </div>
    </article>
  )
}
