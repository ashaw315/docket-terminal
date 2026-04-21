'use client'

import { useState } from 'react'
import type { ProjectWithCount } from '@/types'
import { ProjectCard } from './ProjectCard'
import { ProjectCreateModal } from './ProjectCreateModal'

type Props = {
  projects: ProjectWithCount[]
}

export function ProjectGrid({ projects }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="mb-6 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase text-zinc-500">
          {projects.length} {projects.length === 1 ? 'PROJECT' : 'PROJECTS'}
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="border border-zinc-600 px-3 py-1 font-mono text-xs uppercase tracking-wide text-zinc-300 hover:text-zinc-100 hover:border-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <span className="font-mono text-sm uppercase text-zinc-600">
            NO ACTIVE PROJECTS
          </span>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="font-mono text-xs uppercase text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-zinc-300 hover:decoration-zinc-500 transition-colors duration-150"
          >
            create one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px bg-zinc-800 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <ProjectCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
