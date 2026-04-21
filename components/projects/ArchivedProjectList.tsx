'use client'

import { useState } from 'react'
import type { ProjectWithCount } from '@/types'
import { ArchivedProjectCard } from './ArchivedProjectCard'

type Props = {
  projects: ProjectWithCount[]
}

export function ArchivedProjectList({ projects }: Props) {
  const [local, setLocal] = useState(projects)

  function handleRestored(id: string) {
    setLocal((prev) => prev.filter((p) => p.id !== id))
  }

  if (local.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="font-mono text-sm uppercase text-zinc-600">
          NO ARCHIVED PROJECTS
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-px bg-zinc-800 md:grid-cols-2 lg:grid-cols-3">
      {local.map((p) => (
        <ArchivedProjectCard key={p.id} project={p} onRestored={handleRestored} />
      ))}
    </div>
  )
}
