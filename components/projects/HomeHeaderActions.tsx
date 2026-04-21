'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProjectCreateModal } from './ProjectCreateModal'
import { GenerateBoardModal, type GeneratedBoard } from './GenerateBoardModal'

async function generateBoard(description: string): Promise<GeneratedBoard> {
  const res = await fetch('/api/ai/generate-board', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  if (!res.ok) throw new Error('generate failed')
  const body = await res.json()
  return body.data as GeneratedBoard
}

export function HomeHeaderActions() {
  const [createOpen, setCreateOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)

  return (
    <div className="flex items-baseline gap-3">
      <button
        type="button"
        onClick={() => setGenerateOpen(true)}
        className="border border-zinc-700 px-3 py-1 font-mono text-xs uppercase tracking-wide text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors duration-150"
      >
        Generate →
      </button>
      <Link
        href="/guide"
        className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
      >
        GUIDE →
      </Link>
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="border border-zinc-600 px-3 py-1 font-mono text-xs uppercase tracking-wide text-zinc-300 hover:text-zinc-100 hover:border-zinc-400 hover:bg-zinc-800 transition-colors duration-150"
      >
        New Project
      </button>
      <Link
        href="/archive"
        className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
      >
        ARCHIVE →
      </Link>
      <a
        href="/api/auth/logout"
        className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
      >
        LOGOUT →
      </a>

      <ProjectCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <GenerateBoardModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        generate={generateBoard}
      />
    </div>
  )
}
